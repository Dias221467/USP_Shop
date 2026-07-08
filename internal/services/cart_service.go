package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// availableQty — сколько штук доступно для конкретного цвета/размера
func availableQty(p *models.Product, color, size string) int {
	if len(p.ColorStock) > 0 && color != "" {
		return p.ColorStock[strings.ToLower(color)][size]
	}
	if len(p.SizeStock) > 0 && size != "" {
		return p.SizeStock[size]
	}
	return p.Stock
}

type CartService struct {
	cartRepo    *repository.CartRepository
	productRepo *repository.ProductRepository
}

func NewCartService(cartRepo *repository.CartRepository, productRepo *repository.ProductRepository) *CartService {
	return &CartService{cartRepo: cartRepo, productRepo: productRepo}
}

func (s *CartService) GetCart(ctx context.Context, userID string) (*models.Cart, error) {
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return &models.Cart{Items: []models.CartItem{}, Total: 0}, nil
		}
		return nil, err
	}
	return cart, nil
}

func (s *CartService) AddItem(ctx context.Context, userID string, req models.AddToCartRequest) (*models.Cart, error) {
	if req.Quantity <= 0 {
		return nil, errors.New("quantity must be greater than 0")
	}

	product, err := s.productRepo.FindByID(ctx, req.ProductID)
	if err != nil {
		return nil, errors.New("product not found")
	}

	available := availableQty(product, req.Color, req.Size)
	if available <= 0 {
		return nil, fmt.Errorf("«%s» нет в наличии", product.Name)
	}

	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		cart = &models.Cart{
			ID:        primitive.NewObjectID(),
			UserID:    userObjID,
			Items:     []models.CartItem{},
			CreatedAt: time.Now(),
		}
	}

	image := ""
	if len(product.Images) > 0 {
		image = product.Images[0]
	}
	oldPrice := 0.0
	if product.OldPrice > product.Price {
		oldPrice = product.OldPrice
	}

	productObjID, _ := primitive.ObjectIDFromHex(req.ProductID)
	found := false
	for i, item := range cart.Items {
		if item.ProductID == productObjID && item.Size == req.Size && item.Color == req.Color {
			newQty := item.Quantity + req.Quantity
			if newQty > available {
				newQty = available
			}
			cart.Items[i].Quantity = newQty
			cart.Items[i].Price = product.Price
			cart.Items[i].OldPrice = oldPrice
			cart.Items[i].MaxQty = available
			cart.Items[i].Image = image
			cart.Items[i].Subtotal = float64(newQty) * product.Price
			found = true
			break
		}
	}

	if !found {
		qty := req.Quantity
		if qty > available {
			qty = available
		}
		cart.Items = append(cart.Items, models.CartItem{
			ProductID: productObjID,
			Name:      product.Name,
			Price:     product.Price,
			OldPrice:  oldPrice,
			Size:      req.Size,
			Color:     req.Color,
			Quantity:  qty,
			MaxQty:    available,
			Image:     image,
			Subtotal:  float64(qty) * product.Price,
		})
	}

	cart.Total = calcTotal(cart.Items)
	if err := s.cartRepo.Upsert(ctx, cart); err != nil {
		return nil, err
	}
	return cart, nil
}

func (s *CartService) UpdateItem(ctx context.Context, userID string, req models.UpdateCartItemRequest) (*models.Cart, error) {
	if req.Quantity < 0 {
		return nil, errors.New("quantity cannot be negative")
	}

	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, errors.New("cart not found")
	}

	productObjID, _ := primitive.ObjectIDFromHex(req.ProductID)
	found := false
	for i, item := range cart.Items {
		if item.ProductID == productObjID && item.Size == req.Size && item.Color == req.Color {
			if req.Quantity == 0 {
				cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
			} else {
				qty := req.Quantity
				// Не даём поставить больше, чем есть на складе
				if product, err := s.productRepo.FindByID(ctx, req.ProductID); err == nil {
					if available := availableQty(product, req.Color, req.Size); qty > available {
						qty = available
					}
				}
				cart.Items[i].Quantity = qty
				cart.Items[i].Subtotal = float64(qty) * item.Price
			}
			found = true
			break
		}
	}

	if !found {
		return nil, errors.New("item not found in cart")
	}

	cart.Total = calcTotal(cart.Items)
	if err := s.cartRepo.Upsert(ctx, cart); err != nil {
		return nil, err
	}
	return cart, nil
}

func (s *CartService) RemoveItem(ctx context.Context, userID, productID, size string) (*models.Cart, error) {
	return s.UpdateItem(ctx, userID, models.UpdateCartItemRequest{
		ProductID: productID,
		Size:      size,
		Quantity:  0,
	})
}

func (s *CartService) ClearCart(ctx context.Context, userID string) error {
	return s.cartRepo.Clear(ctx, userID)
}

func calcTotal(items []models.CartItem) float64 {
	var total float64
	for _, item := range items {
		total += item.Subtotal
	}
	return total
}

