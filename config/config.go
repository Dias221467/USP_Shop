package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI     string
	DBName       string
	JWTSecret    string
	Port         string
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	AppURL       string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		MongoURI:     getEnv("MONGO_URI", "mongodb://localhost:27017"),
		DBName:       getEnv("DB_NAME", "uspshop"),
		JWTSecret:    getEnv("JWT_SECRET", "secret"),
		Port:         getEnv("PORT", "8080"),
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		AppURL:       getEnv("APP_URL", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
