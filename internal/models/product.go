package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Category string

const (
	CategoryShoes   Category = "shoes"
	CategoryClothing Category = "clothing"
)

type Product struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Price       float64            `bson:"price" json:"price"`
	Category    Category           `bson:"category" json:"category"`
	Brand       string             `bson:"brand" json:"brand"`
	Images      []string           `bson:"images" json:"images"`
	Sizes       []string           `bson:"sizes" json:"sizes"`
	Colors      []string           `bson:"colors" json:"colors"`
	Stock       int                `bson:"stock" json:"stock"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type ProductRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	Category    Category `json:"category"`
	Brand       string   `json:"brand"`
	Images      []string `json:"images"`
	Sizes       []string `json:"sizes"`
	Colors      []string `json:"colors"`
	Stock       int      `json:"stock"`
}

type ProductPatchRequest struct {
	Name        *string   `json:"name"`
	Description *string   `json:"description"`
	Price       *float64  `json:"price"`
	Category    *Category `json:"category"`
	Brand       *string   `json:"brand"`
	Images      []string  `json:"images"`
	Sizes       []string  `json:"sizes"`
	Colors      []string  `json:"colors"`
	Stock       *int      `json:"stock"`
}

type ProductFilter struct {
	Category Category `json:"category"`
	Brand    string   `json:"brand"`
	MinPrice float64  `json:"min_price"`
	MaxPrice float64  `json:"max_price"`
	Size     string   `json:"size"`
}
