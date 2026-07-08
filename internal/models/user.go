package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type User struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name              string             `bson:"name" json:"name"`
	Email             string             `bson:"email" json:"email"`
	Password          string             `bson:"password" json:"-"`
	Phone             string             `bson:"phone" json:"phone"`
	Role              Role               `bson:"role" json:"role"`
	EmailVerified     bool               `bson:"email_verified" json:"email_verified"`
	VerificationToken string             `bson:"verification_token,omitempty" json:"-"`
	VerificationExp   time.Time          `bson:"verification_exp,omitempty" json:"-"`
	ResetToken        string             `bson:"reset_token,omitempty" json:"-"`
	ResetTokenExp     time.Time          `bson:"reset_token_exp,omitempty" json:"-"`
	TokenVersion      int                `bson:"token_version" json:"-"`
	Favorites         []string           `bson:"favorites,omitempty" json:"-"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}
