package upload

import (
	"bytes"
	"crypto/sha1"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const maxFileSize = 5 << 20 // 5MB

var allowedTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
}

var allowedExts = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

type cloudinaryResponse struct {
	SecureURL string `json:"secure_url"`
	Error     *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func SaveImage(file multipart.File, header *multipart.FileHeader, cloudName, apiKey, apiSecret string) (string, error) {
	if header.Size > maxFileSize {
		return "", errors.New("file size exceeds 5MB limit")
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExts[ext] {
		return "", errors.New("only jpg, png and webp images are allowed")
	}

	buf := make([]byte, 512)
	if _, err := file.Read(buf); err != nil {
		return "", err
	}
	mimeType := http.DetectContentType(buf)
	if !allowedTypes[mimeType] {
		return "", errors.New("only jpg, png and webp images are allowed")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	toSign := fmt.Sprintf("timestamp=%s%s", timestamp, apiSecret)
	h := sha1.New()
	h.Write([]byte(toSign))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	_ = writeField(writer, "api_key", apiKey)
	_ = writeField(writer, "timestamp", timestamp)
	_ = writeField(writer, "signature", signature)

	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", err
	}
	writer.Close()

	url := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result cloudinaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.Error != nil {
		return "", errors.New(result.Error.Message)
	}

	return result.SecureURL, nil
}

func writeField(w *multipart.Writer, key, val string) error {
	fw, err := w.CreateFormField(key)
	if err != nil {
		return err
	}
	_, err = fw.Write([]byte(val))
	return err
}
