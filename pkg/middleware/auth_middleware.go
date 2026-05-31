package middleware

import (
	"context"
	"net/http"
	"strings"

	jwtutil "github.com/Dias221467/USPShop/pkg/jwt"
)

type contextKey string

const UserContextKey contextKey = "user"

type UserFetcher interface {
	FindByID(ctx context.Context, id string) (tokenVersion int, err error)
}

func AuthMiddleware(secret string, fetcher UserFetcher) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtutil.ParseToken(tokenStr, secret)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			currentVersion, err := fetcher.FindByID(r.Context(), claims.UserID)
			if err != nil || currentVersion != claims.TokenVersion {
				http.Error(w, "Token is no longer valid", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*jwtutil.Claims)
		if !ok || claims.Role != "admin" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
