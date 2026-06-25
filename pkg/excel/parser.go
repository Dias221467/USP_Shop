package excel

import (
	"bytes"
	"errors"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type ParsedProduct struct {
	BaseName   string         `json:"base_name"`
	SizeStock  map[string]int `json:"size_stock"`
	Sizes      []string       `json:"sizes"`
	TotalStock int            `json:"total_stock"`
}

var sizeRe = regexp.MustCompile(`р\.\s*(\d+)`)

func ParseStockReport(data []byte) ([]ParsedProduct, error) {
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, errors.New("no sheets in file")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}

	// base name -> size -> qty
	stockMap := map[string]map[string]int{}

	for _, row := range rows {
		if len(row) < 4 {
			continue
		}
		numStr := strings.TrimSpace(row[0])
		if _, err := strconv.Atoi(numStr); err != nil {
			continue
		}

		name := strings.TrimSpace(row[2])
		qtyStr := strings.ReplaceAll(strings.TrimSpace(row[3]), ",", ".")
		qty, err := strconv.ParseFloat(qtyStr, 64)
		if err != nil || qty <= 0 {
			continue
		}

		size := ""
		if m := sizeRe.FindStringSubmatch(name); len(m) >= 2 {
			size = m[1]
			name = strings.TrimSpace(sizeRe.ReplaceAllString(name, ""))
		}

		if stockMap[name] == nil {
			stockMap[name] = map[string]int{}
		}
		stockMap[name][size] += int(qty)
	}

	result := make([]ParsedProduct, 0, len(stockMap))
	for base, sizeQty := range stockMap {
		p := ParsedProduct{
			BaseName:  base,
			SizeStock: sizeQty,
		}
		for size, qty := range sizeQty {
			if size != "" && qty > 0 {
				p.Sizes = append(p.Sizes, size)
			}
			p.TotalStock += qty
		}
		sort.Slice(p.Sizes, func(i, j int) bool {
			a, _ := strconv.Atoi(p.Sizes[i])
			b, _ := strconv.Atoi(p.Sizes[j])
			return a < b
		})
		result = append(result, p)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].BaseName < result[j].BaseName
	})

	return result, nil
}
