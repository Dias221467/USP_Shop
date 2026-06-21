package services

import (
	"context"
	"errors"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type OrderService struct {
	orderRepo *repository.OrderRepository
	cartRepo  *repository.CartRepository
	userRepo  *repository.UserRepository
}

func NewOrderService(orderRepo *repository.OrderRepository, cartRepo *repository.CartRepository, userRepo *repository.UserRepository) *OrderService {
	return &OrderService{orderRepo: orderRepo, cartRepo: cartRepo, userRepo: userRepo}
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
		// Товары переданы напрямую из фронта (localStorage корзина)
		for _, ri := range req.Items {
			productObjID, _ := primitive.ObjectIDFromHex(ri.ProductID)
			subtotal := float64(ri.Quantity) * ri.Price
			items = append(items, models.OrderItem{
				ProductID: productObjID,
				Name:      ri.Name,
				Price:     ri.Price,
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
