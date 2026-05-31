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

type CartRepository struct {
	collection *mongo.Collection
}

func NewCartRepository(db *mongo.Database) *CartRepository {
	return &CartRepository{collection: db.Collection("carts")}
}

func (r *CartRepository) GetByUserID(ctx context.Context, userID string) (*models.Cart, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	var cart models.Cart
	err = r.collection.FindOne(ctx, bson.M{"user_id": objID}).Decode(&cart)
	if err != nil {
		return nil, err
	}
	return &cart, nil
}

func (r *CartRepository) Upsert(ctx context.Context, cart *models.Cart) error {
	cart.UpdatedAt = time.Now()
	opts := options.Update().SetUpsert(true)
	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"user_id": cart.UserID},
		bson.M{"$set": cart},
		opts,
	)
	return err
}

func (r *CartRepository) Clear(ctx context.Context, userID string) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(
		ctx,
		bson.M{"user_id": objID},
		bson.M{"$set": bson.M{"items": []models.CartItem{}, "total": 0, "updated_at": time.Now()}},
	)
	return err
}
