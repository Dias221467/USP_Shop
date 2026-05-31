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
}

func NewOrderService(orderRepo *repository.OrderRepository, cartRepo *repository.CartRepository) *OrderService {
	return &OrderService{orderRepo: orderRepo, cartRepo: cartRepo}
}

func (s *OrderService) CreateFromCart(ctx context.Context, userID string, req models.CreateOrderRequest) (*models.Order, error) {
	if req.ShippingAddress.City == "" || req.ShippingAddress.Street == "" {
		return nil, errors.New("city and street are required")
	}
	if req.PaymentMethod == "" {
		return nil, errors.New("payment method is required")
	}

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

	userObjID, _ := primitive.ObjectIDFromHex(userID)
	items := make([]models.OrderItem, len(cart.Items))
	for i, item := range cart.Items {
		items[i] = models.OrderItem{
			ProductID: item.ProductID,
			Name:      item.Name,
			Price:     item.Price,
			Size:      item.Size,
			Color:     item.Color,
			Quantity:  item.Quantity,
			Subtotal:  item.Subtotal,
		}
	}

	order := &models.Order{
		UserID:          userObjID,
		Items:           items,
		Total:           cart.Total,
		Status:          models.OrderStatusPending,
		ShippingAddress: req.ShippingAddress,
		PaymentMethod:   req.PaymentMethod,
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, err
	}

	// Очищаем корзину после успешного создания заказа
	if err := s.cartRepo.Clear(ctx, userID); err != nil {
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
	// Обычный пользователь может видеть только свои заказы
	if !isAdmin && order.UserID.Hex() != userID {
		return nil, errors.New("order not found")
	}
	return order, nil
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
