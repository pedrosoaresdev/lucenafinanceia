ALTER TABLE financial_transactions
    ADD COLUMN external_reference VARCHAR(128),
    ADD COLUMN provider_item_id VARCHAR(64);

ALTER TABLE financial_transactions ALTER COLUMN source TYPE VARCHAR(32);
ALTER TABLE financial_transactions DROP CONSTRAINT financial_transactions_source_check;
ALTER TABLE financial_transactions ADD CONSTRAINT financial_transactions_source_check
    CHECK (source IN ('MANUAL', 'OPEN_FINANCE', 'OPEN_FINANCE_SANDBOX'));

CREATE UNIQUE INDEX financial_transactions_external_dedup_idx
    ON financial_transactions (owner_uid, source, external_reference)
    WHERE external_reference IS NOT NULL;

CREATE TABLE bank_connections (
    item_id VARCHAR(64) PRIMARY KEY,
    owner_uid VARCHAR(128) NOT NULL,
    institution VARCHAR(120) NOT NULL,
    status VARCHAR(32) NOT NULL,
    is_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ
);

CREATE INDEX bank_connections_owner_idx ON bank_connections (owner_uid, institution);
