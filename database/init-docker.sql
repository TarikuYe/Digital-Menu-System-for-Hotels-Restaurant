-- Combined Initialization Script for Docker
\i /docker-entrypoint-initdb.d/01-schema.sql
\i /docker-entrypoint-initdb.d/02-migration_v2.sql
\i /docker-entrypoint-initdb.d/03-migration_v3_actor_model.sql
\i /docker-entrypoint-initdb.d/04-create_test_users.sql
