package services

import (
	"context"
	"errors"
	"fmt"
	"html"
	"strings"

	"github.com/Dias221467/USPShop/internal/models"
	"github.com/Dias221467/USPShop/internal/repository"
	"github.com/Dias221467/USPShop/pkg/telegram"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type OrderService struct {
	orderRepo   *repository.OrderRepository
	cartRepo    *repository.CartRepository
	userRepo    *repository.UserRepository
	productRepo *repository.ProductRepository
	notifier    *telegram.Notifier
	client      *mongo.Client
}

func NewOrderService(orderRepo *repository.OrderRepository, cartRepo *repository.CartRepository, userRepo *repository.UserRepository, productRepo *repository.ProductRepository, notifier *telegram.Notifier, client *mongo.Client) *OrderService {
	return &OrderService{orderRepo: orderRepo, cartRepo: cartRepo, userRepo: userRepo, productRepo: productRepo, notifier: notifier, client: client}
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

	session, err := s.client.StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(ctx)

	// Списание остатков, создание заказа и очистка корзины — одна транзакция
	// MongoDB. Раньше откат при сбое (например, падении процесса между
	// списанием и созданием заказа) был кодом в памяти запроса и не пережил
	// бы такой сбой — остаток тихо ушёл бы в минус без заказа. Теперь либо
	// фиксируется всё целиком, либо не фиксируется ничего.
	result, err := session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
		var items []models.OrderItem
		var total float64

		if len(req.Items) > 0 {
			// Товары переданы напрямую из фронта (localStorage корзина).
			// Цену и наличие берём из базы — данным клиента не доверяем.
			for _, ri := range req.Items {
				if ri.Quantity <= 0 {
					return nil, errors.New("Некорректное количество товара")
				}
				product, err := s.productRepo.FindByID(sessCtx, ri.ProductID)
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
			cart, err := s.cartRepo.GetByUserID(sessCtx, userID)
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
		}

		order := &models.Order{
			UserID:          userObjID,
			Items:           items,
			Total:           total,
			Status:          models.OrderStatusPending,
			ShippingAddress: req.ShippingAddress,
			PaymentMethod:   req.PaymentMethod,
		}

		if user, err := s.userRepo.GetByID(sessCtx, userID); err == nil {
			order.CustomerName = user.Name
			order.CustomerPhone = user.Phone
		}

		// Атомарная проверка "хватает ли" внутри DecrementStock плюс сама
		// транзакция закрывают гонку одновременных заказов полностью.
		for _, item := range items {
			if err := s.productRepo.DecrementStock(sessCtx, item.ProductID.Hex(), item.Color, item.Size, item.Quantity); err != nil {
				if errors.Is(err, repository.ErrInsufficientStock) {
					return nil, fmt.Errorf("«%s» только что раскупили — обновите корзину", item.Name)
				}
				return nil, err
			}
		}

		if err := s.orderRepo.Create(sessCtx, order); err != nil {
			return nil, err
		}

		// Заказ оформлен — серверная корзина больше не нужна. Если
		// транзакция откатится, откатится и очистка корзины вместе с ней.
		_ = s.cartRepo.Clear(sessCtx, userID)

		return order, nil
	})

	if err != nil {
		return nil, err
	}
	order := result.(*models.Order)

	// Уведомление в Telegram — только после успешного коммита, в фоне
	go s.notifyNewOrder(order)

	return order, nil
}

// notifyNewOrder собирает сообщение с parse_mode: HTML. Все поля, которые
// пришли от покупателя (имя, адрес, комментарий), обязательно экранируем —
// иначе покупатель может вписать в комментарий к заказу свою HTML-ссылку,
// и она превратится в кликабельную ссылку прямо в сообщении владельцу.
func (s *OrderService) notifyNewOrder(order *models.Order) {
	e := html.EscapeString

	var b strings.Builder
	fmt.Fprintf(&b, "🛍 <b>Новый заказ — ₸%.0f</b>\n\n", order.Total)

	for _, it := range order.Items {
		details := e(it.Size)
		if it.Color != "" {
			details = e(it.Color) + " · " + e(it.Size)
		}
		fmt.Fprintf(&b, "• %s (%s) — %d шт. · ₸%.0f\n", e(it.Name), details, it.Quantity, it.Subtotal)
	}

	addr := order.ShippingAddress
	fmt.Fprintf(&b, "\n👤 %s\n📞 %s\n📍 %s, %s %s", e(order.CustomerName), e(order.CustomerPhone), e(addr.City), e(addr.Street), e(addr.House))
	if addr.Flat != "" {
		fmt.Fprintf(&b, ", кв. %s", e(addr.Flat))
	}
	fmt.Fprintf(&b, "\n💳 %s", e(order.PaymentMethod))
	if addr.Comment != "" {
		fmt.Fprintf(&b, "\n💬 %s", e(addr.Comment))
	}

	_ = s.notifier.Send(b.String())
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
	if err := s.orderRepo.UpdateStatus(ctx, orderID, models.OrderStatusCancelled); err != nil {
		return err
	}
	for _, item := range order.Items {
		_ = s.productRepo.RestoreStock(ctx, item.ProductID.Hex(), item.Color, item.Size, item.Quantity)
	}
	return nil
}

func (s *OrderService) GetMyOrders(ctx context.Context, userID string) ([]models.Order, error) {
	return s.orderRepo.FindByUserID(ctx, userID)
}

func (s *OrderService) GetAllOrders(ctx context.Context, status models.OrderStatus, page, limit int, archived bool) (*models.OrderList, error) {
	orders, total, err := s.orderRepo.FindAll(ctx, status, page, limit, archived)
	if err != nil {
		return nil, err
	}
	if orders == nil {
		orders = []models.Order{}
	}
	if page < 1 {
		page = 1
	}
	totalPages := 1
	if limit > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
		if totalPages < 1 {
			totalPages = 1
		}
	}
	return &models.OrderList{Items: orders, Total: total, Page: page, TotalPages: totalPages}, nil
}

func (s *OrderService) GetStats(ctx context.Context) (*models.AdminStats, error) {
	return s.orderRepo.Stats(ctx)
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

	order, err := s.orderRepo.FindByID(ctx, orderID)
	if err != nil {
		return errors.New("order not found")
	}

	if err := s.orderRepo.UpdateStatus(ctx, orderID, req.Status); err != nil {
		return err
	}

	// Отмена возвращает товар на склад, снятие отмены — списывает обратно
	if req.Status == models.OrderStatusCancelled && order.Status != models.OrderStatusCancelled {
		for _, item := range order.Items {
			_ = s.productRepo.RestoreStock(ctx, item.ProductID.Hex(), item.Color, item.Size, item.Quantity)
		}
	} else if req.Status != models.OrderStatusCancelled && order.Status == models.OrderStatusCancelled {
		for _, item := range order.Items {
			_ = s.productRepo.DecrementStock(ctx, item.ProductID.Hex(), item.Color, item.Size, item.Quantity)
		}
	}

	return nil
}
