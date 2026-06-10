-- Si Postgres ya existía antes de init-databases.sql, ejecutar manualmente:
-- docker exec -i importadora-postgres psql -U postgres < infra/scripts/create-ms2-db.sql
SELECT 'CREATE DATABASE importadora_ms2'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'importadora_ms2')\gexec
