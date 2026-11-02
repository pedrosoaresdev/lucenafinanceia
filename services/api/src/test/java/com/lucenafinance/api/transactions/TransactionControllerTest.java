package com.lucenafinance.api.transactions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {
    @Mock
    private FinancialTransactionRepository transactions;

    private TransactionController controller;
    private Jwt user;

    @BeforeEach
    void setUp() {
        controller = new TransactionController(transactions);
        user = Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .claim("sub", "firebase-user-123")
                .build();
    }

    @Test
    void listScopesTransactionsToAuthenticatedFirebaseSubject() {
        when(transactions.findTop200ByOwnerUidOrderByOccurredAtDesc("firebase-user-123"))
                .thenReturn(List.of());

        assertEquals(List.of(), controller.list(user));
        verify(transactions).findTop200ByOwnerUidOrderByOccurredAtDesc("firebase-user-123");
    }

    @Test
    void createUsesAuthenticatedSubjectAndKeepsTheRecordManual() {
        ManualTransactionRequest request = new ManualTransactionRequest(
                "  Mercado  ", 2590L, "brl", "EXPENSE", "Alimentação",
                Instant.parse("2026-11-01T12:00:00Z"), "  almoço  ");
        when(transactions.save(org.mockito.ArgumentMatchers.any(FinancialTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.create(request, user);
        ArgumentCaptor<FinancialTransaction> saved = ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(transactions).save(saved.capture());

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("firebase-user-123", saved.getValue().getOwnerUid());
        assertEquals("Mercado", saved.getValue().getDescription());
        assertEquals("BRL", saved.getValue().getCurrency());
        assertEquals("almoço", saved.getValue().getNotes());
        assertEquals("MANUAL", saved.getValue().getSource());
    }

    @Test
    void createRejectsUnsupportedKindBeforeWriting() {
        ManualTransactionRequest request = new ManualTransactionRequest(
                "Transferência", 1000L, "BRL", "TRANSFER", "Finanças",
                Instant.parse("2026-11-01T12:00:00Z"), null);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.create(request, user));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(transactions, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
