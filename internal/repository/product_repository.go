package repository

import (
	"context"
	"sort"
	"strconv"
	"time"

	"github.com/Dias221467/USPShop/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProductRepository struct {
	collection *mongo.Collection
}

func NewProductRepository(db *mongo.Database) *ProductRepository {
	return &ProductRepository{collection: db.Collection("products")}
}

func (r *ProductRepository) Create(ctx context.Context, p *models.Product) error {
	p.ID = primitive.NewObjectID()
	p.IsActive = true
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	_, err := r.collection.InsertOne(ctx, p)
	return err
}

func (r *ProductRepository) FindByID(ctx context.Context, id string) (*models.Product, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var p models.Product
	err = r.collection.FindOne(ctx, bson.M{"_id": objID, "is_active": true}).Decode(&p)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProductRepository) FindAll(ctx context.Context, filter models.ProductFilter) ([]models.Product, error) {
	query := bson.M{"is_active": true}

	if filter.Category != "" {
		query["category"] = filter.Category
	}
	if filter.Brand != "" {
		query["brand"] = filter.Brand
	}
	if filter.Size != "" {
		query["sizes"] = filter.Size
	}
	if filter.MinPrice > 0 || filter.MaxPrice > 0 {
		priceFilter := bson.M{}
		if filter.MinPrice > 0 {
			priceFilter["$gte"] = filter.MinPrice
		}
		if filter.MaxPrice > 0 {
			priceFilter["$lte"] = filter.MaxPrice
		}
		query["price"] = priceFilter
	}

	opts := options.Find().SetSort(bson.M{"created_at": -1})
	cursor, err := r.collection.Find(ctx, query, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err := cursor.All(ctx, &products); err != nil {
		return nil, err
	}
	return products, nil
}

func (r *ProductRepository) Update(ctx context.Context, id string, p *models.Product) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	p.UpdatedAt = time.Now()
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": p})
	return err
}

func (r *ProductRepository) Patch(ctx context.Context, id string, fields bson.M) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	fields["updated_at"] = time.Now()
	result, err := r.collection.UpdateOne(ctx, bson.M{"_id": objID, "is_active": true}, bson.M{"$set": fields})
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

func (r *ProductRepository) UpdateStock(ctx context.Context, id string, sizeStock map[string]int) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	sizes := []string{}
	total := 0
	for size, qty := range sizeStock {
		if qty > 0 {
			sizes = append(sizes, size)
			total += qty
		}
	}
	sort.Slice(sizes, func(i, j int) bool {
		a, _ := strconv.Atoi(sizes[i])
		b, _ := strconv.Atoi(sizes[j])
		return a < b
	})
	fields := bson.M{
		"size_stock": sizeStock,
		"sizes":      sizes,
		"stock":      total,
		"updated_at": time.Now(),
	}
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": fields})
	return err
}

func (r *ProductRepository) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	// Мягкое удаление — просто скрываем товар
	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"is_active": false, "updated_at": time.Now()}})
	return err
}
