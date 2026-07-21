package repository

import (
	"reflect"
	"testing"
)

func TestSortClothingSizes(t *testing.T) {
	tests := []struct {
		name  string
		input []string
		want  []string
	}{
		{
			name:  "перемешанные буквенные размеры встают в анатомический порядок",
			input: []string{"XL", "S", "3XL", "M", "XS", "L", "2XL"},
			want:  []string{"XS", "S", "M", "L", "XL", "2XL", "3XL"},
		},
		{
			name:  "уже отсортированные размеры не меняются",
			input: []string{"S", "M", "L"},
			want:  []string{"S", "M", "L"},
		},
		{
			name:  "неизвестные размеры (например числовые) сортируются как строки в хвосте",
			input: []string{"L", "Z", "A", "S"},
			want:  []string{"A", "S", "L", "Z"},
		},
		{
			name:  "пустой список",
			input: []string{},
			want:  []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sortClothingSizes(tt.input)
			if !reflect.DeepEqual(tt.input, tt.want) {
				t.Errorf("sortClothingSizes() = %v, want %v", tt.input, tt.want)
			}
		})
	}
}
