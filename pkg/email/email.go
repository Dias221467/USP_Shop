package email

import (
	"fmt"
	"net/smtp"
)

type Sender struct {
	host     string
	port     string
	user     string
	password string
}

func NewSender(host, port, user, password string) *Sender {
	return &Sender{host: host, port: port, user: user, password: password}
}

func (s *Sender) Send(to, subject, body string) error {
	auth := smtp.PlainAuth("", s.user, s.password, s.host)

	msg := fmt.Sprintf(
		"From: USP Store <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		s.user, to, subject, body,
	)

	return smtp.SendMail(
		fmt.Sprintf("%s:%s", s.host, s.port),
		auth,
		s.user,
		[]string{to},
		[]byte(msg),
	)
}

func (s *Sender) SendVerification(to, name, token, appURL string) error {
	link := fmt.Sprintf("%s/verify-email?token=%s", appURL, token)
	body := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:40px">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;padding:40px">
  <h1 style="font-size:28px;font-weight:300;letter-spacing:4px;margin-bottom:8px">USP</h1>
  <p style="color:#999;font-size:12px;letter-spacing:2px;margin-bottom:32px">SEMEY · KAZAKHSTAN</p>
  <h2 style="font-weight:400;font-size:20px;margin-bottom:16px">Привет, %s</h2>
  <p style="color:#555;line-height:1.6;margin-bottom:32px">Подтвердите email-адрес, чтобы активировать аккаунт.</p>
  <a href="%s" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:13px;letter-spacing:2px">ПОДТВЕРДИТЬ EMAIL</a>
  <p style="color:#bbb;font-size:12px;margin-top:32px">Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте письмо.</p>
</div>
</body></html>`, name, link)

	return s.Send(to, "Подтвердите email — USP Store", body)
}

func (s *Sender) SendPasswordReset(to, name, token, appURL string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", appURL, token)
	body := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:40px">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;padding:40px">
  <h1 style="font-size:28px;font-weight:300;letter-spacing:4px;margin-bottom:8px">USP</h1>
  <p style="color:#999;font-size:12px;letter-spacing:2px;margin-bottom:32px">SEMEY · KAZAKHSTAN</p>
  <h2 style="font-weight:400;font-size:20px;margin-bottom:16px">Сброс пароля</h2>
  <p style="color:#555;line-height:1.6;margin-bottom:32px">Привет, %s! Мы получили запрос на сброс пароля для вашего аккаунта.</p>
  <a href="%s" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:13px;letter-spacing:2px">СБРОСИТЬ ПАРОЛЬ</a>
  <p style="color:#bbb;font-size:12px;margin-top:32px">Ссылка действительна 1 час. Если вы не запрашивали сброс — ничего не делайте.</p>
</div>
</body></html>`, name, link)

	return s.Send(to, "Сброс пароля — USP Store", body)
}
