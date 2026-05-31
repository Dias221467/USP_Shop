package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/services"
	jwtutil "github.com/Dias221467/USPShop/pkg/jwt"
	"github.com/Dias221467/USPShop/pkg/middleware"
	"github.com/gorilla/mux"
)

type CartHandler struct {
	service *services.CartService
}

func NewCartHandler(service *services.CartService) *CartHandler {
	return &CartHandler{service: service}
}

// GET /api/cart
func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	cart, err := h.service.GetCart(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, cart)
}

// POST /api/cart
func (h *CartHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var req models.AddToCartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	cart, err := h.service.AddItem(r.Context(), userID, req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, cart)
}

// PUT /api/cart
func (h *CartHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var req models.UpdateCartItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	cart, err := h.service.UpdateItem(r.Context(), userID, req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, cart)
}

// DELETE /api/cart/{productId}/{size}
func (h *CartHandler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	productID := mux.Vars(r)["productId"]
	size := mux.Vars(r)["size"]

	cart, err := h.service.RemoveItem(r.Context(), userID, productID, size)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, cart)
}

// DELETE /api/cart
func (h *CartHandler) ClearCart(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	if err := h.service.ClearCart(r.Context(), userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Cart cleared"})
}

func getUserID(r *http.Request) string {
	claims := r.Context().Value(middleware.UserContextKey).(*jwtutil.Claims)
	return claims.UserID
}
