package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Notifier struct {
	token  string
	chatID string
}

func NewNotifier(token, chatID string) *Notifier {
	return &Notifier{token: token, chatID: chatID}
}

// Send отправляет сообщение в Telegram. Если бот не настроен — тихо выходит.
func (n *Notifier) Send(text string) error {
	if n == nil || n.token == "" || n.chatID == "" {
		return nil
	}

	payload, _ := json.Marshal(map[string]any{
		"chat_id":    n.chatID,
		"text":       text,
		"parse_mode": "HTML",
	})

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", n.token)
	resp, err := http.Post(url, "application/json", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("telegram API error: status %d", resp.StatusCode)
	}
	return nil
}
