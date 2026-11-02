# Modelo de referência do Firestore (não usado no runtime atual)

O armazenamento ativo mudou para PostgreSQL em Docker, conforme `docs/architecture.md`. Este arquivo foi preservado apenas como referência para uma futura integração opcional com Firestore; não implante o modelo nem as regras locais no projeto Firebase.

Todos os dados pertencentes a uma pessoa ficam sob `users/{uid}`. O `uid` é obtido do token Firebase verificado no servidor, nunca aceito como autoridade do cliente.

```text
users/{uid}
  profile/private
  accounts/{accountId}             providerId, institutionName, type, currency, lastSyncedAt
  connections/{connectionId}       provider, status, consentId, consentExpiresAt, revokedAt
  transactions/{transactionId}     sourceId, source, amountMinor, currency, occurredAt, categoryId
  categories/{categoryId}           name, parentId, kind, isCustom
  categoryRules/{ruleId}            matcher, categoryId, priority
  cards/{cardId}                    accountId, brand, lastFour, closingDay, dueDay
  budgets/{budgetId}                categoryId, period, limitMinor
  goals/{goalId}                    name, targetMinor, dueDate, currentMinor
  investments/{investmentId}        kind, institutionId, balanceMinor, asOf
  auditEvents/{eventId}             action, occurredAt, resourceType, resourceId
```

Valores monetários são inteiros na menor unidade (centavos) acompanhados de código ISO de moeda. Transações bancárias importadas são imutáveis; a classificação do usuário fica em metadados controlados por ele. `sourceId` é a chave de idempotência do provedor, com escopo pela conexão. Nunca gravar senhas bancárias, tokens de acesso em documentos, CVV ou número completo de cartão.

O esquema é uma proposta de domínio, não está ainda implementado como repositórios ou regras Firestore validadas.
