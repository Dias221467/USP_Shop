package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	jwtutil "github.com/Dias221467/USPShop/pkg/jwt"
	"github.com/Dias221467/USPShop/pkg/email"
	"github.com/Dias221467/USPShop/pkg/logger"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo      *repository.UserRepository
	jwtSecret string
	mailer    *email.Sender
	appURL    string
}

func NewUserService(repo *repository.UserRepository, jwtSecret string, mailer *email.Sender, appURL string) *UserService {
	return &UserService{repo: repo, jwtSecret: jwtSecret, mailer: mailer, appURL: appURL}
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *UserService) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error) {
	existing, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	verToken, err := generateToken()
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:              req.Name,
		Email:             req.Email,
		Password:          string(hashed),
		Phone:             req.Phone,
		Role:              models.RoleUser,
		EmailVerified:     false,
		VerificationToken: verToken,
		VerificationExp:   time.Now().Add(24 * time.Hour),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	// Отправляем письмо асинхронно, не блокируем ответ
	go func() {
		if err := s.mailer.SendVerification(user.Email, user.Name, verToken, s.appURL); err != nil {
			logger.Log.Errorf("SendVerification failed: %v", err)
		}
	}()

	token, err := jwtutil.GenerateToken(user.ID.Hex(), string(user.Role), s.jwtSecret, user.TokenVersion)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

func (s *UserService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("invalid email or password")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !user.EmailVerified {
		return nil, errors.New("email not verified")
	}

	// Версию токена при входе НЕ увеличиваем — можно быть залогиненным
	// на нескольких устройствах одновременно. Версия растёт только
	// при смене/сбросе пароля, чтобы разлогинить все старые сессии.
	token, err := jwtutil.GenerateToken(user.ID.Hex(), string(user.Role), s.jwtSecret, user.TokenVersion)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user}, nil
}

func (s *UserService) GetByID(ctx context.Context, id string) (*models.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) ResendVerification(ctx context.Context, emailAddr string) error {
	user, err := s.repo.FindByEmail(ctx, emailAddr)
	if err != nil {
		return nil // не раскрываем существование email
	}
	if user.EmailVerified {
		return nil
	}

	token, err := generateToken()
	if err != nil {
		return err
	}

	if err := s.repo.SetVerificationToken(ctx, user.ID.Hex(), token, time.Now().Add(24*time.Hour)); err != nil {
		return err
	}

	go func() {
		if err := s.mailer.SendVerification(user.Email, user.Name, token, s.appURL); err != nil {
			logger.Log.Errorf("ResendVerification failed: %v", err)
		}
	}()
	return nil
}

func (s *UserService) VerifyEmail(ctx context.Context, token string) error {
	user, err := s.repo.FindByVerificationToken(ctx, token)
	if err != nil {
		return errors.New("invalid or expired token")
	}
	if time.Now().After(user.VerificationExp) {
		return errors.New("token expired")
	}
	return s.repo.VerifyEmail(ctx, user.ID.Hex())
}

func (s *UserService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		// Не раскрываем что email не существует
		return nil
	}

	token, err := generateToken()
	if err != nil {
		return err
	}

	if err := s.repo.SetResetToken(ctx, user.Email, token, time.Now().Add(time.Hour)); err != nil {
		return err
	}

	go func() {
		if err := s.mailer.SendPasswordReset(user.Email, user.Name, token, s.appURL); err != nil {
			logger.Log.Errorf("SendPasswordReset failed: %v", err)
		}
	}()
	return nil
}

func (s *UserService) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := s.repo.FindByResetToken(ctx, token)
	if err != nil {
		return errors.New("invalid or expired token")
	}
	if time.Now().After(user.ResetTokenExp) {
		return errors.New("token expired")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.repo.UpdatePassword(ctx, user.ID.Hex(), string(hashed)); err != nil {
		return err
	}

	// Пароль сброшен — разлогиниваем все устройства
	_, _ = s.repo.IncrementTokenVersion(ctx, user.ID.Hex())
	return nil
}

func (s *UserService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	if len(newPassword) < 6 {
		return errors.New("new password must be at least 6 characters")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if err := s.repo.UpdatePassword(ctx, userID, string(hashed)); err != nil {
		return err
	}

	// Пароль изменён — разлогиниваем все устройства (включая текущее,
	// пользователь войдёт заново с новым паролем)
	_, _ = s.repo.IncrementTokenVersion(ctx, userID)
	return nil
}

// ── Избранное ──

func (s *UserService) GetFavorites(ctx context.Context, userID string) ([]string, error) {
	return s.repo.GetFavorites(ctx, userID)
}

func (s *UserService) AddFavorite(ctx context.Context, userID, productID string) error {
	return s.repo.AddFavorite(ctx, userID, productID)
}

func (s *UserService) RemoveFavorite(ctx context.Context, userID, productID string) error {
	return s.repo.RemoveFavorite(ctx, userID, productID)
}

func (s *UserService) MergeFavorites(ctx context.Context, userID string, ids []string) ([]string, error) {
	return s.repo.MergeFavorites(ctx, userID, ids)
}
