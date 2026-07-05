package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/services"
	"github.com/gorilla/mux"
)

type ProductHandler struct {
	service *services.ProductService
}

func NewProductHandler(service *services.ProductService) *ProductHandler {
	return &ProductHandler{service: service}
}

// GET /api/products
func (h *ProductHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := models.ProductFilter{
		Category: models.Category(q.Get("category")),
		Brand:    q.Get("brand"),
		Size:     q.Get("size"),
		Search:   q.Get("search"),
		Sort:     q.Get("sort"),
	}
	if v := q.Get("min_price"); v != "" {
		filter.MinPrice, _ = strconv.ParseFloat(v, 64)
	}
	if v := q.Get("max_price"); v != "" {
		filter.MaxPrice, _ = strconv.ParseFloat(v, 64)
	}
	if q.Get("discounted") == "true" {
		filter.Discounted = true
	}
	if v := q.Get("page"); v != "" {
		filter.Page, _ = strconv.Atoi(v)
	}
	if v := q.Get("limit"); v != "" {
		filter.Limit, _ = strconv.Atoi(v)
	}

	list, err := h.service.GetAll(r.Context(), filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, list)
}

// GET /api/products/brands?category=shoes
func (h *ProductHandler) GetBrands(w http.ResponseWriter, r *http.Request) {
	brands, err := h.service.GetBrands(r.Context(), models.Category(r.URL.Query().Get("category")))
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, brands)
}

// GET /api/products/{id}
func (h *ProductHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	product, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Product not found")
		return
	}
	respondJSON(w, http.StatusOK, product)
}

// POST /api/admin/products
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.ProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	product, err := h.service.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, product)
}

// PUT /api/admin/products/{id}
func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var req models.ProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	product, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, product)
}

// PATCH /api/admin/products/{id}
func (h *ProductHandler) Patch(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var req models.ProductPatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if err := h.service.Patch(r.Context(), id, req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Product updated"})
}

// DELETE /api/admin/products/{id}
func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := h.service.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Product deleted"})
}
