CREATE TABLE billing_checkout_intents (
    id UUID PRIMARY KEY,
    owner_uid VARCHAR(128) NOT NULL,
    plan_code VARCHAR(16) NOT NULL CHECK (plan_code IN ('BRONZE', 'OURO')),
    billing_cycle VARCHAR(16) NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    external_reference VARCHAR(64) NOT NULL UNIQUE,
    checkout_id VARCHAR(80) UNIQUE,
    provider_subscription_id VARCHAR(80) UNIQUE,
    state VARCHAR(24) NOT NULL CHECK (state IN ('PENDING', 'ACTIVE', 'CANCELED', 'EXPIRED', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    access_until TIMESTAMPTZ
);

CREATE INDEX billing_checkout_owner_idx ON billing_checkout_intents (owner_uid, created_at DESC);
CREATE INDEX billing_checkout_subscription_idx ON billing_checkout_intents (provider_subscription_id);

CREATE TABLE billing_webhook_events (
    event_id VARCHAR(180) PRIMARY KEY,
    event_type VARCHAR(80) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL
);
