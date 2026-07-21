package services

import (
	"testing"

	"github.com/Dias221467/USPShop/internal/models"
)

func TestAvailableQty_ColorStock(t *testing.T) {
	product := &models.Product{
		ColorStock: map[string]map[string]int{
			"черный": {"M": 5, "L": 0},
		},
	}

	if got := availableQty(product, "Черный", "M"); got != 5 {
		t.Errorf("availableQty(color=Черный, size=M) = %d, want 5 (case-insensitive lookup)", got)
	}
	if got := availableQty(product, "Черный", "L"); got != 0 {
		t.Errorf("availableQty for sold-out size = %d, want 0", got)
	}
	if got := availableQty(product, "Черный", "XL"); got != 0 {
		t.Errorf("availableQty for size not present in map = %d, want 0", got)
	}
}

func TestAvailableQty_SizeStock(t *testing.T) {
	product := &models.Product{SizeStock: map[string]int{"42": 3}}

	if got := availableQty(product, "", "42"); got != 3 {
		t.Errorf("availableQty(size=42) = %d, want 3", got)
	}
	if got := availableQty(product, "", "99"); got != 0 {
		t.Errorf("availableQty for unknown size = %d, want 0", got)
	}
}

func TestAvailableQty_PlainStockFallback(t *testing.T) {
	product := &models.Product{Stock: 7}
	if got := availableQty(product, "", ""); got != 7 {
		t.Errorf("availableQty with no size/color maps = %d, want 7 (fallback to Stock)", got)
	}
}

func TestCalcTotal(t *testing.T) {
	items := []models.CartItem{
		{Subtotal: 20000},
		{Subtotal: 15500.5},
		{Subtotal: 0},
	}
	if got := calcTotal(items); got != 35500.5 {
		t.Errorf("calcTotal() = %v, want 35500.5", got)
	}

	if got := calcTotal(nil); got != 0 {
		t.Errorf("calcTotal(nil) = %v, want 0", got)
	}
	if got := calcTotal([]models.CartItem{}); got != 0 {
		t.Errorf("calcTotal(empty) = %v, want 0", got)
	}
}
