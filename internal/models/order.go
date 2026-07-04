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
	CustomerName    string             `bson:"customer_name" json:"customer_name"`
	CustomerPhone   string             `bson:"customer_phone" json:"customer_phone"`
	Items           []OrderItem        `bson:"items" json:"items"`
	Total           float64            `bson:"total" json:"total"`
	Status          OrderStatus        `bson:"status" json:"status"`
	ShippingAddress ShippingAddress    `bson:"shipping_address" json:"shipping_address"`
	PaymentMethod   string             `bson:"payment_method" json:"payment_method"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateOrderRequestItem struct {
	ProductID string  `json:"product_id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Size      string  `json:"size"`
	Color     string  `json:"color"`
	Quantity  int     `json:"quantity"`
}

type CreateOrderRequest struct {
	ShippingAddress ShippingAddress          `json:"shipping_address"`
	PaymentMethod   string                   `json:"payment_method"`
	Items           []CreateOrderRequestItem `json:"items,omitempty"`
}

type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status"`
}

type PeriodStats struct {
	Orders  int64   `json:"orders"`
	Revenue float64 `json:"revenue"`
}

type TopProduct struct {
	Name    string  `json:"name" bson:"_id"`
	Qty     int64   `json:"qty" bson:"qty"`
	Revenue float64 `json:"revenue" bson:"revenue"`
}

type AdminStats struct {
	Day          PeriodStats      `json:"day"`
	Week         PeriodStats      `json:"week"`
	Month        PeriodStats      `json:"month"`
	All          PeriodStats      `json:"all"`
	StatusCounts map[string]int64 `json:"status_counts"`
	TopProducts  []TopProduct     `json:"top_products"`
}
