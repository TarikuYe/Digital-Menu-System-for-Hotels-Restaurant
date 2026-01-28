# Docker Setup for Digital Menu System

This project is now dockerized for easy deployment and development. 

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

## Quick Start

To start the entire system (Frontend, Backend, and Database):

```bash
docker-compose up --build
```

The system will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (from outside Docker)

## Services Included

1.  **db**: PostgreSQL 15 database. Data is persisted in a Docker volume named `postgres_data`.
2.  **backend**: Node.js Express API.
3.  **frontend**: React application served by Nginx.

## Initializing the Database

On the first run, the database is automatically initialized using `database/schema.sql`.

If you need to run update scripts or migrations:

```bash
# Run a specific update script inside the DB container
docker exec -i digital-menu-db psql -U postgres -d hotel_menu_system < database/update_orders_v1.sql
```

Alternatively, you can run the backend scripts:

```bash
docker exec -it digital-menu-backend npm run setup-admin
```

## Environment Variables

The system uses default values for development. To customize them, you can create a `.env` file in the root directory (where `docker-compose.yml` is located).

Keys you might want to override:
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

## Troubleshooting

- **Logs**: View logs for all services with `docker-compose logs -f`.
- **Backend Logs**: `docker-compose logs -f backend`.
- **Fresh Start**: If you want to reset the database, run `docker-compose down -v` and then `docker-compose up`. (Note: This deletes all data).
