package com.lucenafinance.api.profiles;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ProfileCryptoServiceTest {
    @Test
    void encryptsPersonalDataWithUniqueCiphertextAndDoesNotStorePlaintext() throws Exception {
        ProfileCryptoService crypto = new ProfileCryptoService("test-only-secret-key");
        String first = crypto.encrypt("52998224725");
        String second = crypto.encrypt("52998224725");

        assertNotEquals(first, second);
        assertFalse(new String(Base64.getDecoder().decode(first), StandardCharsets.UTF_8).contains("52998224725"));
    }
}
