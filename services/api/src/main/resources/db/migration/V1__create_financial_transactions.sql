CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY,
    owner_uid VARCHAR(128) NOT NULL,
    description VARCHAR(120) NOT NULL,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('BRL', 'USD', 'EUR')),
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('INCOME', 'EXPENSE')),
    category_id VARCHAR(80) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    notes VARCHAR(1000) NOT NULL DEFAULT '',
    source VARCHAR(16) NOT NULL CHECK (source IN ('MANUAL', 'OPEN_FINANCE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX financial_transactions_owner_date_idx
    ON financial_transactions (owner_uid, occurred_at DESC);
