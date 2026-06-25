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
	ExcelName   string         `json:"excel_name"`
	SizeStock   map[string]int `json:"size_stock"`
	Sizes       []string       `json:"sizes"`
	TotalStock  int            `json:"total_stock"`
	MatchedID   string         `json:"matched_id"`
	MatchedName string         `json:"matched_name"`
}

type ApplyRequest struct {
	Items []struct {
		ProductID string         `json:"product_id"`
		SizeStock map[string]int `json:"size_stock"`
	} `json:"items"`
}

func normalizeStr(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' {
			b.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(b.String()), " ")
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

	// build lookup: normalized atiko_name -> product
	atikoIndex := map[string]models.Product{}
	for _, p := range products {
		if p.AtikoName != "" {
			atikoIndex[normalizeStr(p.AtikoName)] = p
		}
	}

	var result []ImportPreviewItem
	for _, ep := range parsed {
		item := ImportPreviewItem{
			ExcelName:  ep.BaseName,
			SizeStock:  ep.SizeStock,
			Sizes:      ep.Sizes,
			TotalStock: ep.TotalStock,
		}
		key := normalizeStr(ep.BaseName)
		if p, ok := atikoIndex[key]; ok {
			item.MatchedID = p.ID.Hex()
			item.MatchedName = p.Name
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
		err := h.productRepo.UpdateStock(r.Context(), item.ProductID, item.SizeStock)
		if err == nil {
			updated++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"updated": updated})
}
