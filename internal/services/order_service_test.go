package services

import (
	"strings"
	"testing"

	"github.com/Dias221467/USPShop/internal/models"
)

func TestCheckStock_ColorStock(t *testing.T) {
	product := &models.Product{
		Name: "Худи Carhartt",
		ColorStock: map[string]map[string]int{
			// Хранится в нижнем регистре — так же, как в реальной базе после Excel-импорта
			"синяя": {"XL": 1, "2XL": 3},
		},
	}

	tests := []struct {
		name    string
		color   string
		size    string
		qty     int
		wantErr bool
	}{
		{"хватает ровно на весь остаток", "Синяя", "2XL", 3, false},
		{"хватает с запасом", "Синяя", "XL", 1, false},
		{"не хватает — просят больше, чем есть", "Синяя", "XL", 2, true},
		{"размер раскуплен подчистую", "Синяя", "L", 1, true},
		{"регистр цвета не должен влиять (админ вводит с большой буквы)", "СИНЯЯ", "XL", 1, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkStock(product, tt.color, tt.size, tt.qty)
			if (err != nil) != tt.wantErr {
				t.Errorf("checkStock(%q, %q, %d) error = %v, wantErr %v", tt.color, tt.size, tt.qty, err, tt.wantErr)
			}
		})
	}
}

func TestCheckStock_SizeStock(t *testing.T) {
	product := &models.Product{
		Name:      "Nike Air Force 1",
		SizeStock: map[string]int{"42": 1, "43": 0},
	}

	if err := checkStock(product, "", "42", 1); err != nil {
		t.Errorf("expected size 42 with stock 1 to be purchasable, got error: %v", err)
	}
	if err := checkStock(product, "", "42", 2); err == nil {
		t.Error("expected error when requesting more than available stock")
	}
	if err := checkStock(product, "", "43", 1); err == nil {
		t.Error("expected error for size with zero stock")
	}
	if !strings.Contains(checkStock(product, "", "43", 1).Error(), "нет в наличии") {
		t.Error("expected 'нет в наличии' message for zero-stock size")
	}
}

func TestCheckStock_PlainStockFallback(t *testing.T) {
	// Товар без разбивки по размерам/цветам (SizeStock и ColorStock не заданы) —
	// проверка идёт по общему полю Stock.
	product := &models.Product{Name: "Шапка", Stock: 2}

	if err := checkStock(product, "", "", 2); err != nil {
		t.Errorf("expected purchase within total stock to succeed, got: %v", err)
	}
	if err := checkStock(product, "", "", 3); err == nil {
		t.Error("expected error when exceeding total stock")
	}

	soldOut := &models.Product{Name: "Шапка", Stock: 0}
	if err := checkStock(soldOut, "", "", 1); err == nil {
		t.Error("expected error for product with zero total stock")
	}
}

func TestCheckStock_ZeroOrNegativeQuantity(t *testing.T) {
	// qty=0 не должен требовать наличия — вызывающий код (CreateFromCart) сам
	// отсекает qty<=0 до вызова checkStock, но функция не должна ложно падать
	product := &models.Product{Name: "Товар", Stock: 5}
	if err := checkStock(product, "", "", 0); err != nil {
		t.Errorf("checkStock with qty=0 should not error, got: %v", err)
	}
}
