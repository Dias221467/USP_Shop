package middleware

import "net/http"

// MaxBodyBytes ограничивает размер тела любого запроса. Без этого
// JSON-эндпоинты (регистрация, заказы, товары и т.д.) могли принять
// сколь угодно большое тело и забить память сервера — в отличие от
// загрузки фото, где лимит уже был. Для JSON 5MB — с огромным запасом.
func MaxBodyBytes(limit int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, limit)
			next.ServeHTTP(w, r)
		})
	}
}
