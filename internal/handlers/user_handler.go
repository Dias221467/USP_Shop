package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/services"
	jwtutil "github.com/Dias221467/USPShop/pkg/jwt"
	"github.com/Dias221467/USPShop/pkg/middleware"
)

var _ = jwtutil.Claims{} // ensure import used

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" || req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Name, email and password are required")
		return
	}
	resp, err := h.service.Register(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, resp)
}

func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*jwtutil.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	user, err := h.service.GetByID(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Token is required")
		return
	}
	if err := h.service.VerifyEmail(r.Context(), token); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Email verified successfully"})
}

func (h *UserHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
		respondError(w, http.StatusBadRequest, "Email is required")
		return
	}
	h.service.ResendVerification(r.Context(), body.Email)
	// Всегда 200 — не раскрываем существование email
	respondJSON(w, http.StatusOK, map[string]string{"message": "If the email exists, a verification link has been sent"})
}

func (h *UserHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	// Всегда возвращаем 200 — не раскрываем существование email
	h.service.ForgotPassword(r.Context(), req.Email)
	respondJSON(w, http.StatusOK, map[string]string{"message": "If the email exists, a reset link has been sent"})
}

func (h *UserHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Token == "" || len(req.Password) < 6 {
		respondError(w, http.StatusBadRequest, "Token and password (min 6 chars) are required")
		return
	}
	if err := h.service.ResetPassword(r.Context(), req.Token, req.Password); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Password updated successfully"})
}

func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*jwtutil.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		respondError(w, http.StatusBadRequest, "Current and new passwords are required")
		return
	}

	if err := h.service.ChangePassword(r.Context(), claims.UserID, req.CurrentPassword, req.NewPassword); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Password changed successfully"})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
