package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI               string
	DBName                 string
	JWTSecret              string
	Port                   string
	SMTPUser               string
	ResendAPIKey           string
	AppURL                 string
	CloudinaryCloudName    string
	CloudinaryAPIKey       string
	CloudinaryAPISecret    string
	TelegramBotToken       string
	TelegramChatID         string
	OrderRetentionDays     int
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		MongoURI:            getEnv("MONGO_URI", "mongodb://localhost:27017"),
		DBName:              getEnv("DB_NAME", "uspshop"),
		JWTSecret:           getEnv("JWT_SECRET", "secret"),
		Port:                getEnv("PORT", "8080"),
		SMTPUser:            getEnv("SMTP_USER", ""),
		ResendAPIKey:        getEnv("RESEND_API_KEY", ""),
		AppURL:              getEnv("APP_URL", "http://localhost:3000"),
		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret: getEnv("CLOUDINARY_API_SECRET", ""),
		TelegramBotToken:    getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramChatID:      getEnv("TELEGRAM_CHAT_ID", ""),
		OrderRetentionDays:  getEnvInt("ORDER_RETENTION_DAYS", 30),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if n, err := strconv.Atoi(value); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}
