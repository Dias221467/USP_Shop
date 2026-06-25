package excel

import (
	"bytes"
	"errors"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type RawRow struct {
	Name string
	Qty  int
}

func ParseRawRows(data []byte) ([]RawRow, error) {
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

	var result []RawRow
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
		result = append(result, RawRow{Name: name, Qty: int(qty)})
	}
	return result, nil
}
