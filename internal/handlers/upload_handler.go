package handlers

import (
	"net/http"

	"github.com/Dias221467/USPShop/pkg/upload"
)

type UploadHandler struct {
	cloudName   string
	apiKey      string
	apiSecret   string
}

func NewUploadHandler(cloudName, apiKey, apiSecret string) *UploadHandler {
	return &UploadHandler{cloudName: cloudName, apiKey: apiKey, apiSecret: apiSecret}
}

// POST /api/admin/upload
func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "File too large or invalid form data")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Image file is required (field name: image)")
		return
	}
	defer file.Close()

	url, err := upload.SaveImage(file, header, h.cloudName, h.apiKey, h.apiSecret)

	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"url": url})
}
