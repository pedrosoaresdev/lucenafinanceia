package com.lucenafinance.api.profiles;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProfileRequest(@NotBlank @Size(max = 120) String fullName,
                             @NotBlank String cpf,
                             @NotNull LocalDate dateOfBirth) {
    public ProfileRequest {
        if (fullName != null && fullName.trim().split("\\s+").length < 2) {
            throw new IllegalArgumentException("Informe o nome completo");
        }
        if (cpf != null) new ObjetoCpf(cpf);
        if (dateOfBirth != null) new ObjetoDataDeNascimento(dateOfBirth);
    }
}
