package services

import (
	"context"
	"errors"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProductService struct {
	repo *repository.ProductRepository
}

func NewProductService(repo *repository.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) Create(ctx context.Context, req models.ProductRequest) (*models.Product, error) {
	if req.Name == "" || req.Price <= 0 {
		return nil, errors.New("name and price are required")
	}
	if req.Category != models.CategoryShoes && req.Category != models.CategoryClothing {
		return nil, errors.New("category must be 'shoes' or 'clothing'")
	}

	p := &models.Product{
		Name:        req.Name,
		AtikoName:   req.AtikoName,
		Description: req.Description,
		Price:       req.Price,
		OldPrice:    req.OldPrice,
		Category:    req.Category,
		Brand:       req.Brand,
		Images:      req.Images,
		Sizes:       req.Sizes,
		Colors:      req.Colors,
		Stock:       req.Stock,
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProductService) GetByID(ctx context.Context, id string) (*models.Product, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ProductService) GetAll(ctx context.Context, filter models.ProductFilter) ([]models.Product, error) {
	return s.repo.FindAll(ctx, filter)
}

func (s *ProductService) Update(ctx context.Context, id string, req models.ProductRequest) (*models.Product, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("product not found")
	}

	p.Name = req.Name
	p.AtikoName = req.AtikoName
	p.Description = req.Description
	p.Price = req.Price
	p.OldPrice = req.OldPrice
	p.Category = req.Category
	p.Brand = req.Brand
	p.Images = req.Images
	p.Sizes = req.Sizes
	p.Colors = req.Colors
	p.Stock = req.Stock

	if err := s.repo.Update(ctx, id, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProductService) Patch(ctx context.Context, id string, req models.ProductPatchRequest) error {
	fields := bson.M{}
	if req.Name != nil {
		fields["name"] = *req.Name
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.Price != nil {
		fields["price"] = *req.Price
	}
	if req.Category != nil {
		fields["category"] = *req.Category
	}
	if req.Brand != nil {
		fields["brand"] = *req.Brand
	}
	if req.Images != nil {
		fields["images"] = req.Images
	}
	if req.Sizes != nil {
		fields["sizes"] = req.Sizes
	}
	if req.Colors != nil {
		fields["colors"] = req.Colors
	}
	if req.Stock != nil {
		fields["stock"] = *req.Stock
	}
	if len(fields) == 0 {
		return errors.New("no fields to update")
	}
	if err := s.repo.Patch(ctx, id, fields); err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("product not found or already deleted")
		}
		return err
	}
	return nil
}

func (s *ProductService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
