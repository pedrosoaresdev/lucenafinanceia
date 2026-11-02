package com.lucenafinance.api.profiles;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfileValueObjectsTest {
    @Test
    void cpfAcceptsValidDigitsAndNormalizesFormatting() {
        assertEquals("52998224725", new ObjetoCpf("529.982.247-25").valor());
    }

    @Test
    void cpfRejectsInvalidCheckDigits() {
        assertThrows(IllegalArgumentException.class, () -> new ObjetoCpf("529.982.247-24"));
    }

    @Test
    void birthDateRejectsFutureDates() {
        assertThrows(IllegalArgumentException.class,
                () -> new ObjetoDataDeNascimento(LocalDate.now().plusDays(1)));
    }

    @Test
    void profileRequiresAFullName() {
        assertThrows(IllegalArgumentException.class,
                () -> new ProfileRequest("Pedro", "52998224725", LocalDate.of(1990, 1, 1)));
    }
}
