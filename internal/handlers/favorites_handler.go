package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GET /api/favorites — список id избранных товаров
func (h *UserHandler) GetFavorites(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	favs, err := h.service.GetFavorites(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Не удалось загрузить избранное")
		return
	}
	respondJSON(w, http.StatusOK, favs)
}

// POST /api/favorites/{productId}
func (h *UserHandler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	productID := mux.Vars(r)["productId"]
	if _, err := primitive.ObjectIDFromHex(productID); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product id")
		return
	}
	if err := h.service.AddFavorite(r.Context(), claims.UserID, productID); err != nil {
		respondError(w, http.StatusInternalServerError, "Не удалось сохранить")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "added"})
}

// DELETE /api/favorites/{productId}
func (h *UserHandler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)
	productID := mux.Vars(r)["productId"]
	if err := h.service.RemoveFavorite(r.Context(), claims.UserID, productID); err != nil {
		respondError(w, http.StatusInternalServerError, "Не удалось удалить")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "removed"})
}

// POST /api/favorites/sync — слить локальное избранное с серверным после входа
func (h *UserHandler) SyncFavorites(w http.ResponseWriter, r *http.Request) {
	claims := getClaims(r)

	var req struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Отсеиваем мусор и ограничиваем размер
	valid := []string{}
	for _, id := range req.IDs {
		if _, err := primitive.ObjectIDFromHex(id); err == nil {
			valid = append(valid, id)
		}
		if len(valid) >= 200 {
			break
		}
	}

	favs, err := h.service.MergeFavorites(r.Context(), claims.UserID, valid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Не удалось синхронизировать")
		return
	}
	respondJSON(w, http.StatusOK, favs)
}
