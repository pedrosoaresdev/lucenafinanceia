CREATE TABLE financial_profiles (
    owner_uid VARCHAR(128) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    cpf_ciphertext VARCHAR(256) NOT NULL,
    date_of_birth DATE NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
