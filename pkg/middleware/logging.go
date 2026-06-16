package middleware

import (
	"net/http"
	"time"

	"github.com/Dias221467/USPShop/pkg/logger"
)

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		duration := time.Since(start)

		entry := logger.Log.WithFields(map[string]interface{}{
			"method":   r.Method,
			"path":     r.URL.Path,
			"status":   rw.status,
			"duration": duration.String(),
			"ip":       r.RemoteAddr,
		})

		if rw.status >= 500 {
			entry.Error("request")
		} else if rw.status >= 400 {
			entry.Warn("request")
		} else {
			entry.Info("request")
		}
	})
}
