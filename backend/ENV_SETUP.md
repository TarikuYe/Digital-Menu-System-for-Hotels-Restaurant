# .env File Setup Guide

## Quick Setup

Your `.env` file needs to be created/updated in the `backend` directory.

## Step 1: Create/Edit the .env File

**Location:** `backend/.env`

## Step 2: Copy This Content

Open `backend/.env` in a text editor and paste this:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=Tare@kiya

# JWT Configuration
# Generate a secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=hotel_menu_system_jwt_secret_key_2024_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Step 3: Important Notes

1. **DB_PASSWORD**: Make sure this matches your PostgreSQL password (currently set to `Tare@kiya`)
2. **JWT_SECRET**: This is a placeholder - for production, generate a secure random key
3. **No quotes**: Don't put quotes around values in .env files
4. **No spaces**: No spaces around the `=` sign

## Step 4: Generate a Secure JWT_SECRET (Optional but Recommended)

Run this command to generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and replace `JWT_SECRET` value in your `.env` file.

## Step 5: Verify Configuration

After creating/editing `.env`, run:

```powershell
node check-env.js
```

This will verify all required variables are set correctly.

## Troubleshooting

### If .env file doesn't exist:
1. Create a new file named `.env` in the `backend` folder
2. Copy the content above
3. Save the file

### If variables are still not loading:
1. Make sure the file is named exactly `.env` (not `.env.txt`)
2. Make sure it's in the `backend` directory (not root)
3. Restart your server after editing

### If you get "password authentication failed":
- Check that `DB_PASSWORD` matches your PostgreSQL password
- Test connection: `npm run check-db`

## File Structure

```
backend/
├── .env          ← This file (create it here)
├── server.js
├── package.json
└── ...
```

## Required Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `hotel_menu_system` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `Tare@kiya` |
| `JWT_SECRET` | Secret key for JWT tokens | Random string |
| `JWT_EXPIRE` | Token expiration | `7d` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |

