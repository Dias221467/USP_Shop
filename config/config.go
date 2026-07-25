package config

import (
	"log"
	"os"
	"strconv"
	"strings"

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
	AllowedOrigins         []string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" || jwtSecret == "secret" {
		log.Fatal("JWT_SECRET is not set (or is the insecure default) — refusing to start. Set a real secret in the environment.")
	}

	return &Config{
		MongoURI:            getEnv("MONGO_URI", "mongodb://localhost:27017"),
		DBName:              getEnv("DB_NAME", "uspshop"),
		JWTSecret:           jwtSecret,
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
		AllowedOrigins:      getEnvList("ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// getEnvList читает список через запятую, например "https://a.com,https://b.com"
func getEnvList(key string, fallback []string) []string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	var list []string
	for _, item := range strings.Split(value, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			list = append(list, item)
		}
	}
	if len(list) == 0 {
		return fallback
	}
	return list
}

func getEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if n, err := strconv.Atoi(value); err == nil && n > 0 {
			return n
		}
	}
	return fallback
}
