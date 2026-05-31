package services

import (
	"context"
	"errors"
	"time"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

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
	if product.Stock < req.Quantity {
		return nil, errors.New("not enough stock")
	}

	if req.Size != "" && !containsSize(product.Sizes, req.Size) {
		return nil, errors.New("size not available for this product")
	}
	if req.Color != "" && !containsColor(product.Colors, req.Color) {
		return nil, errors.New("color not available for this product")
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

	productObjID, _ := primitive.ObjectIDFromHex(req.ProductID)
	found := false
	for i, item := range cart.Items {
		if item.ProductID == productObjID && item.Size == req.Size && item.Color == req.Color {
			cart.Items[i].Quantity += req.Quantity
			cart.Items[i].Subtotal = float64(cart.Items[i].Quantity) * item.Price
			found = true
			break
		}
	}

	if !found {
		cart.Items = append(cart.Items, models.CartItem{
			ProductID: productObjID,
			Name:      product.Name,
			Price:     product.Price,
			Size:      req.Size,
			Color:     req.Color,
			Quantity:  req.Quantity,
			Subtotal:  float64(req.Quantity) * product.Price,
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
		if item.ProductID == productObjID && item.Size == req.Size {
			if req.Quantity == 0 {
				cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
			} else {
				cart.Items[i].Quantity = req.Quantity
				cart.Items[i].Subtotal = float64(req.Quantity) * item.Price
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

func containsSize(sizes []string, size string) bool {
	for _, s := range sizes {
		if s == size {
			return true
		}
	}
	return false
}

func containsColor(colors []string, color string) bool {
	for _, c := range colors {
		if c == color {
			return true
		}
	}
	return false
}
