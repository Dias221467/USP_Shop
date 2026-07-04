package repository

import (
	"context"
	"time"

	"github.com/Dias221467/USPShop/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OrderRepository struct {
	collection *mongo.Collection
}

func NewOrderRepository(db *mongo.Database) *OrderRepository {
	return &OrderRepository{collection: db.Collection("orders")}
}

func (r *OrderRepository) Create(ctx context.Context, order *models.Order) error {
	order.ID = primitive.NewObjectID()
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, order)
	return err
}

func (r *OrderRepository) FindByID(ctx context.Context, id string) (*models.Order, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var order models.Order
	err = r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&order)
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) FindByUserID(ctx context.Context, userID string) ([]models.Order, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	opts := options.Find().SetSort(bson.M{"created_at": -1})
	cursor, err := r.collection.Find(ctx, bson.M{"user_id": objID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	if err := cursor.All(ctx, &orders); err != nil {
		return nil, err
	}
	return orders, nil
}

func (r *OrderRepository) FindAll(ctx context.Context) ([]models.Order, error) {
	opts := options.Find().SetSort(bson.M{"created_at": -1})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	if err := cursor.All(ctx, &orders); err != nil {
		return nil, err
	}
	return orders, nil
}

// Stats считает статистику для админки агрегациями MongoDB
func (r *OrderRepository) Stats(ctx context.Context) (*models.AdminStats, error) {
	stats := &models.AdminStats{
		StatusCounts: map[string]int64{},
		TopProducts:  []models.TopProduct{},
	}

	// Заказы и выручка за период (отменённые не считаем)
	period := func(since time.Time, allTime bool) (models.PeriodStats, error) {
		match := bson.M{"status": bson.M{"$ne": models.OrderStatusCancelled}}
		if !allTime {
			match["created_at"] = bson.M{"$gte": since}
		}
		cursor, err := r.collection.Aggregate(ctx, []bson.M{
			{"$match": match},
			{"$group": bson.M{"_id": nil, "orders": bson.M{"$sum": 1}, "revenue": bson.M{"$sum": "$total"}}},
		})
		if err != nil {
			return models.PeriodStats{}, err
		}
		defer cursor.Close(ctx)
		var res []struct {
			Orders  int64   `bson:"orders"`
			Revenue float64 `bson:"revenue"`
		}
		if err := cursor.All(ctx, &res); err != nil {
			return models.PeriodStats{}, err
		}
		if len(res) == 0 {
			return models.PeriodStats{}, nil
		}
		return models.PeriodStats{Orders: res[0].Orders, Revenue: res[0].Revenue}, nil
	}

	now := time.Now()
	var err error
	if stats.Day, err = period(now.Add(-24*time.Hour), false); err != nil {
		return nil, err
	}
	if stats.Week, err = period(now.AddDate(0, 0, -7), false); err != nil {
		return nil, err
	}
	if stats.Month, err = period(now.AddDate(0, 0, -30), false); err != nil {
		return nil, err
	}
	if stats.All, err = period(time.Time{}, true); err != nil {
		return nil, err
	}

	// Количество заказов по статусам
	cursor, err := r.collection.Aggregate(ctx, []bson.M{
		{"$group": bson.M{"_id": "$status", "count": bson.M{"$sum": 1}}},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var statusRows []struct {
		Status string `bson:"_id"`
		Count  int64  `bson:"count"`
	}
	if err := cursor.All(ctx, &statusRows); err != nil {
		return nil, err
	}
	for _, row := range statusRows {
		stats.StatusCounts[row.Status] = row.Count
	}

	// Топ-5 товаров по количеству проданных штук
	topCursor, err := r.collection.Aggregate(ctx, []bson.M{
		{"$match": bson.M{"status": bson.M{"$ne": models.OrderStatusCancelled}}},
		{"$unwind": "$items"},
		{"$group": bson.M{
			"_id":     "$items.name",
			"qty":     bson.M{"$sum": "$items.quantity"},
			"revenue": bson.M{"$sum": "$items.subtotal"},
		}},
		{"$sort": bson.M{"qty": -1}},
		{"$limit": 5},
	})
	if err != nil {
		return nil, err
	}
	defer topCursor.Close(ctx)
	if err := topCursor.All(ctx, &stats.TopProducts); err != nil {
		return nil, err
	}

	return stats, nil
}

func (r *OrderRepository) UpdateStatus(ctx context.Context, id string, status models.OrderStatus) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"status": status, "updated_at": time.Now()}},
	)
	return err
}
