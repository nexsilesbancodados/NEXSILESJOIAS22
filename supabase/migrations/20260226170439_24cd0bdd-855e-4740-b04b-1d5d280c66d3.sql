-- Enable pgcrypto extension required for password hashing (crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
