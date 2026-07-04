package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
	"unicode"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"github.com/Dias221467/USPShop/pkg/excel"
)

type ImportHandler struct {
	productRepo *repository.ProductRepository
}

func NewImportHandler(productRepo *repository.ProductRepository) *ImportHandler {
	return &ImportHandler{productRepo: productRepo}
}

type ImportPreviewItem struct {
	AtikoName   string                    `json:"atiko_name"`
	SizeStock   map[string]int            `json:"size_stock"`
	ColorStock  map[string]map[string]int `json:"color_stock"`
	TotalStock  int                       `json:"total_stock"`
	MatchedID   string                    `json:"matched_id"`
	MatchedName string                    `json:"matched_name"`
	Category    string                    `json:"category"`
}

type ApplyItem struct {
	ProductID  string                    `json:"product_id"`
	SizeStock  map[string]int            `json:"size_stock"`
	ColorStock map[string]map[string]int `json:"color_stock"`
	Category   string                    `json:"category"`
}

type ApplyRequest struct {
	Items []ApplyItem `json:"items"`
}

var shoeRe = regexp.MustCompile(`р\.\s*(\d+)`)

// Atiko uses lowercase l that looks like I in small fonts — normalize both
var clothingSizeNorm = map[string]string{
	"XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
	"2XL": "2XL", "2XI": "2XL",
	"3XL": "3XL", "3XI": "3XL",
	"XXL": "2XL", "XXXL": "3XL",
}

func norm(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' {
			b.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

func isClothingSize(s string) bool {
	_, ok := clothingSizeNorm[strings.ToUpper(s)]
	return ok
}

func normClothingSize(s string) string {
	if v, ok := clothingSizeNorm[strings.ToUpper(s)]; ok {
		return v
	}
	return strings.ToUpper(s)
}

func matchShoes(rows []excel.RawRow, atikoName string) map[string]int {
	sizeStock := map[string]int{}
	normAtiko := norm(atikoName)
	for _, row := range rows {
		name := row.Name
		m := shoeRe.FindStringSubmatch(name)
		if len(m) < 2 {
			continue
		}
		size := m[1]
		base := norm(strings.TrimSpace(shoeRe.ReplaceAllString(name, "")))
		if base == normAtiko {
			sizeStock[size] += row.Qty
		}
	}
	return sizeStock
}

func matchClothing(rows []excel.RawRow, atikoName string) map[string]map[string]int {
	colorStock := map[string]map[string]int{}
	normAtiko := norm(atikoName)
	for _, row := range rows {
		normRow := norm(row.Name)
		if !strings.HasPrefix(normRow, normAtiko) {
			continue
		}
		suffix := strings.TrimSpace(normRow[len(normAtiko):])
		if suffix == "" {
			continue
		}
		words := strings.Fields(suffix)
		if len(words) == 0 {
			continue
		}
		lastWord := words[len(words)-1]
		if !isClothingSize(lastWord) {
			continue
		}
		size := normClothingSize(lastWord)
		color := strings.Join(words[:len(words)-1], " ")
		if color == "" {
			color = "default"
		}
		if colorStock[color] == nil {
			colorStock[color] = map[string]int{}
		}
		colorStock[color][size] += row.Qty
	}
	return colorStock
}

func (h *ImportHandler) Preview(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "file too large", http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "read error", http.StatusInternalServerError)
		return
	}

	rows, err := excel.ParseRawRows(data)
	if err != nil {
		http.Error(w, "parse error: "+err.Error(), http.StatusBadRequest)
		return
	}

	products, _, err := h.productRepo.FindAll(r.Context(), models.ProductFilter{})
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	var result []ImportPreviewItem
	for _, p := range products {
		if p.AtikoName == "" {
			continue
		}
		item := ImportPreviewItem{
			AtikoName:   p.AtikoName,
			MatchedID:   p.ID.Hex(),
			MatchedName: p.Name,
			Category:    string(p.Category),
		}
		if p.Category == models.CategoryShoes {
			ss := matchShoes(rows, p.AtikoName)
			if len(ss) == 0 {
				continue
			}
			item.SizeStock = ss
			for _, q := range ss {
				item.TotalStock += q
			}
		} else {
			cs := matchClothing(rows, p.AtikoName)
			if len(cs) == 0 {
				continue
			}
			item.ColorStock = cs
			for _, ss := range cs {
				for _, q := range ss {
					item.TotalStock += q
				}
			}
		}
		result = append(result, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *ImportHandler) Apply(w http.ResponseWriter, r *http.Request) {
	var req ApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	updated := 0
	for _, item := range req.Items {
		if item.ProductID == "" {
			continue
		}
		var err error
		if item.Category == "shoes" {
			err = h.productRepo.UpdateStock(r.Context(), item.ProductID, item.SizeStock)
		} else {
			err = h.productRepo.UpdateColorStock(r.Context(), item.ProductID, item.ColorStock)
		}
		if err == nil {
			updated++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"updated": updated})
}
