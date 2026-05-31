package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CartItem struct {
	ProductID primitive.ObjectID `bson:"product_id" json:"product_id"`
	Name      string             `bson:"name" json:"name"`
	Price     float64            `bson:"price" json:"price"`
	Size      string             `bson:"size" json:"size"`
	Color     string             `bson:"color" json:"color"`
	Quantity  int                `bson:"quantity" json:"quantity"`
	Subtotal  float64            `bson:"subtotal" json:"subtotal"`
}

type Cart struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	Items     []CartItem         `bson:"items" json:"items"`
	Total     float64            `bson:"total" json:"total"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type AddToCartRequest struct {
	ProductID string `json:"product_id"`
	Size      string `json:"size"`
	Color     string `json:"color"`
	Quantity  int    `json:"quantity"`
}

type UpdateCartItemRequest struct {
	ProductID string `json:"product_id"`
	Size      string `json:"size"`
	Quantity  int    `json:"quantity"`
}
