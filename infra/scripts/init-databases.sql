-- MS-2: base dedicada (MS-1 ya se crea vía POSTGRES_DB=importadora_vehiculos)
SELECT 'CREATE DATABASE importadora_ms2'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'importadora_ms2')\gexec
