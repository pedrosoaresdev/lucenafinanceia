package com.lucenafinance.api.profiles;

import java.time.LocalDate;
import java.util.Objects;

/** Birth date value object. Future dates are rejected. */
public record ObjetoDataDeNascimento(LocalDate valor) {
    public ObjetoDataDeNascimento {
        Objects.requireNonNull(valor, "Data de nascimento é obrigatória");
        if (valor.isAfter(LocalDate.now())) throw new IllegalArgumentException("Data de nascimento não pode estar no futuro");
        if (valor.isBefore(LocalDate.of(1900, 1, 1))) throw new IllegalArgumentException("Data de nascimento inválida");
    }
}
