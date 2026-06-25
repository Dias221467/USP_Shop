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
	Name       string   `json:"name"`
	Sizes      []string `json:"sizes"`
	TotalStock int      `json:"total_stock"`
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

	type item struct {
		base string
		size string
		qty  int
	}

	var items []item
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

		items = append(items, item{base: name, size: size, qty: int(qty)})
	}

	productMap := map[string]*ParsedProduct{}
	sizeSet := map[string]map[string]bool{}

	for _, it := range items {
		if _, ok := productMap[it.base]; !ok {
			productMap[it.base] = &ParsedProduct{Name: it.base}
			sizeSet[it.base] = map[string]bool{}
		}
		productMap[it.base].TotalStock += it.qty
		if it.size != "" {
			sizeSet[it.base][it.size] = true
		}
	}

	result := make([]ParsedProduct, 0, len(productMap))
	for name, p := range productMap {
		for s := range sizeSet[name] {
			p.Sizes = append(p.Sizes, s)
		}
		sort.Slice(p.Sizes, func(i, j int) bool {
			a, _ := strconv.Atoi(p.Sizes[i])
			b, _ := strconv.Atoi(p.Sizes[j])
			return a < b
		})
		result = append(result, *p)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Name < result[j].Name
	})

	return result, nil
}
