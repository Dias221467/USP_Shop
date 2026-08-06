package middleware

import "net/http"

// SecurityHeaders — базовые заголовки, которых раньше не было вообще.
// Ничего экзотического: закрывают самые дешёвые для атакующего векторы.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Браузер не должен угадывать тип контента по содержимому —
		// защита от MIME-sniffing атак.
		w.Header().Set("X-Content-Type-Options", "nosniff")
		// Запрещаем встраивать сайт в <iframe> на чужих доменах —
		// защита от clickjacking на страницах логина/checkout.
		w.Header().Set("X-Frame-Options", "DENY")
		// Не светим полный адрес страницы (с query-параметрами вроде
		// токенов сброса пароля) во внешние Referer при переходе по ссылкам.
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		// Браузер игнорирует это на http, но на https (прод) заставляет
		// обращаться только по HTTPS следующий год.
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		next.ServeHTTP(w, r)
	})
}
