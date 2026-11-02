package com.lucenafinance.api.profiles;

import java.util.Objects;

/** Brazilian CPF value object. Keeps only the normalized digits in memory. */
public record ObjetoCpf(String valor) {
    public ObjetoCpf {
        Objects.requireNonNull(valor, "CPF is required");
        valor = valor.replaceAll("\\D", "");
        if (!isValid(valor)) throw new IllegalArgumentException("CPF inválido");
    }

    public static boolean isValid(String digits) {
        if (digits == null || !digits.matches("\\d{11}") || digits.chars().distinct().count() == 1) return false;
        int first = checksum(digits, 9);
        int second = checksum(digits, 10);
        return first == Character.digit(digits.charAt(9), 10)
                && second == Character.digit(digits.charAt(10), 10);
    }

    private static int checksum(String digits, int length) {
        int sum = 0;
        for (int i = 0; i < length; i++) sum += Character.digit(digits.charAt(i), 10) * (length + 1 - i);
        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }
}
