package jwt

import "testing"

func TestGenerateAndParseToken_RoundTrip(t *testing.T) {
	tokenStr, err := GenerateToken("user123", "admin", "test-secret", 5)
	if err != nil {
		t.Fatalf("GenerateToken returned error: %v", err)
	}

	claims, err := ParseToken(tokenStr, "test-secret")
	if err != nil {
		t.Fatalf("ParseToken returned error for a freshly generated token: %v", err)
	}

	if claims.UserID != "user123" {
		t.Errorf("UserID = %q, want %q", claims.UserID, "user123")
	}
	if claims.Role != "admin" {
		t.Errorf("Role = %q, want %q", claims.Role, "admin")
	}
	if claims.TokenVersion != 5 {
		t.Errorf("TokenVersion = %d, want 5", claims.TokenVersion)
	}
}

func TestParseToken_WrongSecret(t *testing.T) {
	// Токен, подписанный чужим секретом (например, слово-заглушка "secret"
	// из дефолтного конфига), не должен проходить проверку боевым секретом.
	tokenStr, err := GenerateToken("user123", "user", "secret-A", 1)
	if err != nil {
		t.Fatalf("GenerateToken returned error: %v", err)
	}

	if _, err := ParseToken(tokenStr, "secret-B"); err == nil {
		t.Error("expected ParseToken to reject a token signed with a different secret")
	}
}

func TestParseToken_MalformedToken(t *testing.T) {
	if _, err := ParseToken("not-a-real-jwt", "test-secret"); err == nil {
		t.Error("expected ParseToken to reject a malformed token string")
	}
}

func TestGenerateToken_DifferentUsersProduceDifferentTokens(t *testing.T) {
	tokenA, _ := GenerateToken("user-A", "user", "secret", 1)
	tokenB, _ := GenerateToken("user-B", "user", "secret", 1)
	if tokenA == tokenB {
		t.Error("tokens for different users should not be identical")
	}
}
