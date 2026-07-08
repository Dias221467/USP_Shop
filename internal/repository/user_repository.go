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

func (r *UserRepository) SetVerificationToken(ctx context.Context, id string, token string, exp time.Time) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{
			"verification_token": token,
			"verification_exp":   exp,
			"updated_at":         time.Now(),
		},
	})
	return err
}

func (r *UserRepository) FindByVerificationToken(ctx context.Context, token string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"verification_token": token}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) VerifyEmail(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set":   bson.M{"email_verified": true, "updated_at": time.Now()},
		"$unset": bson.M{"verification_token": "", "verification_exp": ""},
	})
	return err
}

func (r *UserRepository) SetResetToken(ctx context.Context, email string, token string, exp time.Time) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"email": email}, bson.M{
		"$set": bson.M{
			"reset_token":     token,
			"reset_token_exp": exp,
			"updated_at":      time.Now(),
		},
	})
	return err
}

func (r *UserRepository) FindByResetToken(ctx context.Context, token string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"reset_token": token}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id string, hashedPassword string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set":   bson.M{"password": hashedPassword, "updated_at": time.Now()},
		"$unset": bson.M{"reset_token": "", "reset_token_exp": ""},
	})
	return err
}

// ── Избранное ──

func (r *UserRepository) GetFavorites(ctx context.Context, id string) ([]string, error) {
	user, err := r.findByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Favorites == nil {
		return []string{}, nil
	}
	return user.Favorites, nil
}

func (r *UserRepository) AddFavorite(ctx context.Context, id string, productID string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$addToSet": bson.M{"favorites": productID},
	})
	return err
}

func (r *UserRepository) RemoveFavorite(ctx context.Context, id string, productID string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$pull": bson.M{"favorites": productID},
	})
	return err
}

// MergeFavorites добавляет локальные id к серверным и возвращает объединённый список
func (r *UserRepository) MergeFavorites(ctx context.Context, id string, ids []string) ([]string, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	if len(ids) > 0 {
		if _, err := r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
			"$addToSet": bson.M{"favorites": bson.M{"$each": ids}},
		}); err != nil {
			return nil, err
		}
	}
	return r.GetFavorites(ctx, id)
}
