package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Dias221467/USPShop/config"
	"github.com/Dias221467/USPShop/internal/handlers"
	"github.com/Dias221467/USPShop/internal/repository"
	"github.com/Dias221467/USPShop/internal/services"
	"github.com/Dias221467/USPShop/pkg/email"
	"github.com/Dias221467/USPShop/pkg/logger"
	"github.com/Dias221467/USPShop/pkg/middleware"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	logger.Init()

	cfg := config.Load()
	mongoClient := config.ConnectMongo(cfg.MongoURI)
	db := mongoClient.Database(cfg.DBName)

	// Repositories
	userRepo := repository.NewUserRepository(db)
	productRepo := repository.NewProductRepository(db)
	cartRepo := repository.NewCartRepository(db)
	orderRepo := repository.NewOrderRepository(db)

	// Email sender
	mailer := email.NewSender(cfg.ResendAPIKey, cfg.SMTPUser)

	// Services
	userService := services.NewUserService(userRepo, cfg.JWTSecret, mailer, cfg.AppURL)
	productService := services.NewProductService(productRepo)
	cartService := services.NewCartService(cartRepo, productRepo)
	orderService := services.NewOrderService(orderRepo, cartRepo, userRepo)

	// Handlers
	userHandler := handlers.NewUserHandler(userService)
	productHandler := handlers.NewProductHandler(productService)
	cartHandler := handlers.NewCartHandler(cartService)
	orderHandler := handlers.NewOrderHandler(orderService)
	uploadHandler := handlers.NewUploadHandler(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	supportHandler := handlers.NewSupportHandler()

	r := mux.NewRouter()
	r.Use(middleware.LoggingMiddleware)

	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	// Auth routes
	auth := r.PathPrefix("/api/auth").Subrouter()
	auth.HandleFunc("/register", userHandler.Register).Methods("POST")
	auth.HandleFunc("/login", userHandler.Login).Methods("POST")
	auth.HandleFunc("/verify-email", userHandler.VerifyEmail).Methods("GET")
	auth.HandleFunc("/resend-verification", userHandler.ResendVerification).Methods("POST")
	auth.HandleFunc("/forgot-password", userHandler.ForgotPassword).Methods("POST")
	auth.HandleFunc("/reset-password", userHandler.ResetPassword).Methods("POST")

	// Public product routes
	r.HandleFunc("/api/products", productHandler.GetAll).Methods("GET")
	r.HandleFunc("/api/products/{id}", productHandler.GetByID).Methods("GET")

	// Static files (uploaded images)
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Protected routes (требуют токен)
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret, userRepo))
	api.HandleFunc("/me", userHandler.Me).Methods("GET")
	api.HandleFunc("/change-password", userHandler.ChangePassword).Methods("PATCH")

	// Cart routes
	api.HandleFunc("/cart", cartHandler.GetCart).Methods("GET")
	api.HandleFunc("/cart", cartHandler.AddItem).Methods("POST")
	api.HandleFunc("/cart", cartHandler.UpdateItem).Methods("PUT")
	api.HandleFunc("/cart", cartHandler.ClearCart).Methods("DELETE")
	api.HandleFunc("/cart/{productId}/{size}", cartHandler.RemoveItem).Methods("DELETE")

	// Order routes
	api.HandleFunc("/orders", orderHandler.Create).Methods("POST")
	api.HandleFunc("/orders", orderHandler.GetMyOrders).Methods("GET")
	api.HandleFunc("/orders/{id}", orderHandler.GetByID).Methods("GET")
	api.HandleFunc("/orders/{id}/cancel", orderHandler.CancelOrder).Methods("PATCH")
	api.HandleFunc("/support/me", supportHandler.GetVisitorInfo).Methods("GET")

	// Admin routes (требуют токен + роль admin)
	admin := r.PathPrefix("/api/admin").Subrouter()
	admin.Use(middleware.AuthMiddleware(cfg.JWTSecret, userRepo))
	admin.Use(middleware.AdminMiddleware)
	admin.HandleFunc("/products", productHandler.Create).Methods("POST")
	admin.HandleFunc("/products/{id}", productHandler.Update).Methods("PUT")
	admin.HandleFunc("/products/{id}", productHandler.Patch).Methods("PATCH")
	admin.HandleFunc("/products/{id}", productHandler.Delete).Methods("DELETE")
	admin.HandleFunc("/orders", orderHandler.GetAll).Methods("GET")
	admin.HandleFunc("/orders/{id}/status", orderHandler.UpdateStatus).Methods("PATCH")
	admin.HandleFunc("/upload", uploadHandler.UploadImage).Methods("POST")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	})

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%s", cfg.Port),
		Handler:           c.Handler(r),
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Log.Infof("Server started on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Log.Info("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := mongoClient.Disconnect(ctx); err != nil {
		logger.Log.Errorf("MongoDB disconnect error: %v", err)
	}
	if err := srv.Shutdown(ctx); err != nil {
		logger.Log.Fatalf("Server forced to shutdown: %v", err)
	}
	logger.Log.Info("Server stopped")
}
