package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type Notifier struct {
	token   string
	chatIDs []string
}

// NewNotifier принимает один или несколько chat_id через запятую —
// уведомление уходит всем получателям одного и того же бота.
func NewNotifier(token, chatIDs string) *Notifier {
	var ids []string
	for _, id := range strings.Split(chatIDs, ",") {
		id = strings.TrimSpace(id)
		if id != "" {
			ids = append(ids, id)
		}
	}
	return &Notifier{token: token, chatIDs: ids}
}

// Send отправляет сообщение всем настроенным получателям.
// Если бот не настроен — тихо выходит. Ошибка одного получателя
// не мешает отправке остальным.
func (n *Notifier) Send(text string) error {
	if n == nil || n.token == "" || len(n.chatIDs) == 0 {
		return nil
	}

	var lastErr error
	for _, chatID := range n.chatIDs {
		if err := n.sendTo(chatID, text); err != nil {
			lastErr = err
		}
	}
	return lastErr
}

func (n *Notifier) sendTo(chatID, text string) error {
	payload, _ := json.Marshal(map[string]any{
		"chat_id":    chatID,
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
		return fmt.Errorf("telegram API error for chat %s: status %d", chatID, resp.StatusCode)
	}
	return nil
}
