package handlers

import (
	"net/http"

	jwtutil "github.com/Dias221467/USPShop/pkg/jwt"
	"github.com/Dias221467/USPShop/pkg/middleware"
)

type SupportHandler struct{}

func NewSupportHandler() *SupportHandler {
	return &SupportHandler{}
}

// GET /api/support/me
// Возвращает данные пользователя для передачи в Tawk.to виджет
func (h *SupportHandler) GetVisitorInfo(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*jwtutil.Claims)
	if !ok {
		respondJSON(w, http.StatusOK, map[string]string{})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"user_id": claims.UserID,
		"role":    claims.Role,
	})
}
