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

type UserRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) *UserRepository {
	return &UserRepository{collection: db.Collection("users")}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, user)
	return err
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID implements middleware.UserFetcher — возвращает только token_version
func (r *UserRepository) FindByID(ctx context.Context, id string) (int, error) {
	user, err := r.findByID(ctx, id)
	if err != nil {
		return 0, err
	}
	return user.TokenVersion, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	return r.findByID(ctx, id)
}

func (r *UserRepository) findByID(ctx context.Context, id string) (*models.User, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var user models.User
	err = r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) IncrementTokenVersion(ctx context.Context, id string) (int, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return 0, err
	}
	result := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$inc": bson.M{"token_version": 1}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	var user models.User
	if err := result.Decode(&user); err != nil {
		return 0, err
	}
	return user.TokenVersion, nil
}
