-- Create application user with limited privileges
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'altee_app') THEN
      
      CREATE ROLE altee_app LOGIN PASSWORD 'app_password_change_in_production';
   END IF;
END
$do$;

-- Grant necessary privileges
GRANT CONNECT ON DATABASE altee_prod TO altee_app;
GRANT USAGE ON SCHEMA public TO altee_app;
GRANT CREATE ON SCHEMA public TO altee_app;

-- Grant table privileges (will apply to future tables as well)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO altee_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO altee_app;