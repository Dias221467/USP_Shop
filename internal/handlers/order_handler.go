package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/services"
	jwtutil "github.com/Dias221467/USPShop/pkg/jwt"
	"github.com/Dias221467/USPShop/pkg/middleware"
	"github.com/gorilla/mux"
)

type OrderHandler struct {
	service *services.OrderService
}

func NewOrderHandler(service *services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

// POST /api/orders
func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	order, err := h.service.CreateFromCart(r.Context(), claims.UserID, req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, order)
}

// GET /api/orders
func (h *OrderHandler) GetMyOrders(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	orders, err := h.service.GetMyOrders(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, orders)
}

// PATCH /api/orders/{id}/cancel
func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	id := mux.Vars(r)["id"]
	if err := h.service.CancelOrder(r.Context(), id, claims.UserID); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Order cancelled"})
}

// GET /api/orders/{id}
func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	id := mux.Vars(r)["id"]
	isAdmin := claims.Role == "admin"

	order, err := h.service.GetByID(r.Context(), id, claims.UserID, isAdmin)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, order)
}

// GET /api/admin/orders?status=pending&page=1&limit=20
func (h *OrderHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	list, err := h.service.GetAllOrders(r.Context(), models.OrderStatus(q.Get("status")), page, limit, q.Get("archived") == "true")
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, list)
}

// GET /api/admin/stats
func (h *OrderHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetStats(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, stats)
}

// PATCH /api/admin/orders/{id}/status
func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var req models.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.service.UpdateStatus(r.Context(), id, req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Status updated"})
}

func getClaims(r *http.Request) *jwtutil.Claims {
	return r.Context().Value(middleware.UserContextKey).(*jwtutil.Claims)
}
