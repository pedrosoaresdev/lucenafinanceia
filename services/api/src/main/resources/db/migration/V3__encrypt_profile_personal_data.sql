DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM financial_profiles) THEN
        RAISE EXCEPTION 'V3 needs a reviewed encryption migration because profile rows already exist';
    END IF;
END $$;

ALTER TABLE financial_profiles DROP COLUMN full_name;
ALTER TABLE financial_profiles DROP COLUMN date_of_birth;
ALTER TABLE financial_profiles ADD COLUMN full_name_ciphertext VARCHAR(256) NOT NULL;
ALTER TABLE financial_profiles ADD COLUMN birth_date_ciphertext VARCHAR(256) NOT NULL;
