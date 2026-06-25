package handlers

import (
	"encoding/json"
	"io"
	"net/http"
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
	ExcelName  string   `json:"excel_name"`
	Sizes      []string `json:"sizes"`
	TotalStock int      `json:"total_stock"`
	MatchedID  string   `json:"matched_id"`
	MatchedName string  `json:"matched_name"`
}

type ApplyRequest struct {
	Items []struct {
		ProductID  string   `json:"product_id"`
		Sizes      []string `json:"sizes"`
		TotalStock int      `json:"total_stock"`
	} `json:"items"`
}

func normalize(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' {
			b.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

func matchScore(excelName, dbName string) int {
	en := normalize(excelName)
	dn := normalize(dbName)
	if en == dn {
		return 100
	}
	if strings.Contains(en, dn) || strings.Contains(dn, en) {
		return 80
	}
	// count common words
	enWords := strings.Fields(en)
	dnWords := strings.Fields(dn)
	dnSet := map[string]bool{}
	for _, w := range dnWords {
		if len(w) > 2 {
			dnSet[w] = true
		}
	}
	common := 0
	for _, w := range enWords {
		if len(w) > 2 && dnSet[w] {
			common++
		}
	}
	if common == 0 {
		return 0
	}
	return common * 100 / len(dnWords)
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

	parsed, err := excel.ParseStockReport(data)
	if err != nil {
		http.Error(w, "parse error: "+err.Error(), http.StatusBadRequest)
		return
	}

	products, err := h.productRepo.FindAll(r.Context(), models.ProductFilter{})
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	var result []ImportPreviewItem
	for _, ep := range parsed {
		item := ImportPreviewItem{
			ExcelName:  ep.Name,
			Sizes:      ep.Sizes,
			TotalStock: ep.TotalStock,
		}
		best := 0
		for _, p := range products {
			score := matchScore(ep.Name, p.Name)
			if score > best {
				best = score
				item.MatchedID = p.ID.Hex()
				item.MatchedName = p.Name
			}
		}
		if best < 50 {
			item.MatchedID = ""
			item.MatchedName = ""
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
		err := h.productRepo.UpdateStock(r.Context(), item.ProductID, item.Sizes, item.TotalStock)
		if err == nil {
			updated++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"updated": updated})
}
