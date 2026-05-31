package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusShipped   OrderStatus = "shipped"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type ShippingAddress struct {
	City    string `bson:"city" json:"city"`
	Street  string `bson:"street" json:"street"`
	House   string `bson:"house" json:"house"`
	Flat    string `bson:"flat" json:"flat"`
	Comment string `bson:"comment" json:"comment"`
}

type OrderItem struct {
	ProductID primitive.ObjectID `bson:"product_id" json:"product_id"`
	Name      string             `bson:"name" json:"name"`
	Price     float64            `bson:"price" json:"price"`
	Size      string             `bson:"size" json:"size"`
	Color     string             `bson:"color" json:"color"`
	Quantity  int                `bson:"quantity" json:"quantity"`
	Subtotal  float64            `bson:"subtotal" json:"subtotal"`
}

type Order struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"user_id" json:"user_id"`
	Items           []OrderItem        `bson:"items" json:"items"`
	Total           float64            `bson:"total" json:"total"`
	Status          OrderStatus        `bson:"status" json:"status"`
	ShippingAddress ShippingAddress    `bson:"shipping_address" json:"shipping_address"`
	PaymentMethod   string             `bson:"payment_method" json:"payment_method"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateOrderRequest struct {
	ShippingAddress ShippingAddress `json:"shipping_address"`
	PaymentMethod   string          `json:"payment_method"`
}

type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status"`
}
