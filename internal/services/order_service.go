package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type OrderService struct {
	orderRepo   *repository.OrderRepository
	cartRepo    *repository.CartRepository
	userRepo    *repository.UserRepository
	productRepo *repository.ProductRepository
}

func NewOrderService(orderRepo *repository.OrderRepository, cartRepo *repository.CartRepository, userRepo *repository.UserRepository, productRepo *repository.ProductRepository) *OrderService {
	return &OrderService{orderRepo: orderRepo, cartRepo: cartRepo, userRepo: userRepo, productRepo: productRepo}
}

// checkStock проверяет, хватает ли товара на складе для запрошенного количества
func checkStock(p *models.Product, color, size string, qty int) error {
	if len(p.ColorStock) > 0 && color != "" {
		available := p.ColorStock[strings.ToLower(color)][size]
		if available <= 0 {
			return fmt.Errorf("«%s» (%s, %s) нет в наличии", p.Name, color, size)
		}
		if available < qty {
			return fmt.Errorf("«%s» (%s, %s): осталось только %d шт.", p.Name, color, size, available)
		}
		return nil
	}
	if len(p.SizeStock) > 0 && size != "" {
		available := p.SizeStock[size]
		if available <= 0 {
			return fmt.Errorf("«%s» (размер %s) нет в наличии", p.Name, size)
		}
		if available < qty {
			return fmt.Errorf("«%s» (размер %s): осталось только %d шт.", p.Name, size, available)
		}
		return nil
	}
	if p.Stock <= 0 {
		return fmt.Errorf("«%s» нет в наличии", p.Name)
	}
	if p.Stock < qty {
		return fmt.Errorf("«%s»: осталось только %d шт.", p.Name, p.Stock)
	}
	return nil
}

func (s *OrderService) CreateFromCart(ctx context.Context, userID string, req models.CreateOrderRequest) (*models.Order, error) {
	if req.ShippingAddress.City == "" || req.ShippingAddress.Street == "" {
		return nil, errors.New("city and street are required")
	}
	if req.PaymentMethod == "" {
		return nil, errors.New("payment method is required")
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)
	var items []models.OrderItem
	var total float64

	if len(req.Items) > 0 {
		// Товары переданы напрямую из фронта (localStorage корзина).
		// Цену и наличие берём из базы — данным клиента не доверяем.
		for _, ri := range req.Items {
			if ri.Quantity <= 0 {
				return nil, errors.New("Некорректное количество товара")
			}
			product, err := s.productRepo.FindByID(ctx, ri.ProductID)
			if err != nil {
				return nil, fmt.Errorf("Товар «%s» больше недоступен", ri.Name)
			}
			if err := checkStock(product, ri.Color, ri.Size, ri.Quantity); err != nil {
				return nil, err
			}
			subtotal := float64(ri.Quantity) * product.Price
			items = append(items, models.OrderItem{
				ProductID: product.ID,
				Name:      product.Name,
				Price:     product.Price,
				Size:      ri.Size,
				Color:     ri.Color,
				Quantity:  ri.Quantity,
				Subtotal:  subtotal,
			})
			total += subtotal
		}
	} else {
		// Фолбэк: читаем из серверной корзины
		cart, err := s.cartRepo.GetByUserID(ctx, userID)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, errors.New("cart is empty")
			}
			return nil, err
		}
		if len(cart.Items) == 0 {
			return nil, errors.New("cart is empty")
		}
		for _, item := range cart.Items {
			items = append(items, models.OrderItem{
				ProductID: item.ProductID,
				Name:      item.Name,
				Price:     item.Price,
				Size:      item.Size,
				Color:     item.Color,
				Quantity:  item.Quantity,
				Subtotal:  item.Subtotal,
			})
		}
		total = cart.Total
		s.cartRepo.Clear(ctx, userID)
	}

	order := &models.Order{
		UserID:          userObjID,
		Items:           items,
		Total:           total,
		Status:          models.OrderStatusPending,
		ShippingAddress: req.ShippingAddress,
		PaymentMethod:   req.PaymentMethod,
	}

	if user, err := s.userRepo.GetByID(ctx, userID); err == nil {
		order.CustomerName = user.Name
		order.CustomerPhone = user.Phone
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, err
	}

	for _, item := range items {
		_ = s.productRepo.DecrementStock(ctx, item.ProductID.Hex(), item.Color, item.Size, item.Quantity)
	}

	return order, nil
}

func (s *OrderService) GetByID(ctx context.Context, orderID, userID string, isAdmin bool) (*models.Order, error) {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("order not found")
		}
		return nil, err
	}
	if !isAdmin && order.UserID.Hex() != userID {
		return nil, errors.New("order not found")
	}
	return order, nil
}

func (s *OrderService) CancelOrder(ctx context.Context, orderID, userID string) error {
	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return errors.New("order not found")
	}
	if order.UserID.Hex() != userID {
		return errors.New("order not found")
	}
	if order.Status != models.OrderStatusPending {
		return errors.New("only pending orders can be cancelled")
	}
	return s.orderRepo.UpdateStatus(ctx, orderID, models.OrderStatusCancelled)
}

func (s *OrderService) GetMyOrders(ctx context.Context, userID string) ([]models.Order, error) {
	return s.orderRepo.FindByUserID(ctx, userID)
}

func (s *OrderService) GetAllOrders(ctx context.Context) ([]models.Order, error) {
	return s.orderRepo.FindAll(ctx)
}

func (s *OrderService) UpdateStatus(ctx context.Context, orderID string, req models.UpdateOrderStatusRequest) error {
	validStatuses := map[models.OrderStatus]bool{
		models.OrderStatusPending:   true,
		models.OrderStatusPaid:      true,
		models.OrderStatusShipped:   true,
		models.OrderStatusDelivered: true,
		models.OrderStatusCancelled: true,
	}
	if !validStatuses[req.Status] {
		return errors.New("invalid status")
	}

	_, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return errors.New("order not found")
	}

	return s.orderRepo.UpdateStatus(ctx, orderID, req.Status)
}
