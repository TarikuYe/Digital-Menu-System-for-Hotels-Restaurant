# Quick Start Guide

## Prerequisites Check

- ✅ PostgreSQL installed and running
- ✅ Database `hotel_menu_system` created
- ✅ Node.js (v16+) installed

## Step-by-Step Setup (5 minutes)

### 1. Database Setup (2 minutes)

```bash
# Connect to PostgreSQL and create database (if not already created)
psql -U postgres
CREATE DATABASE hotel_menu_system;
\q

# Run the schema script
psql -U postgres -d hotel_menu_system -f database/schema.sql
```

### 2. Backend Setup (1 minute)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

**Backend should now be running on http://localhost:5000**

### 3. Frontend Setup (1 minute)

```bash
cd frontend
npm install
npm run dev
```

**Frontend should now be running on http://localhost:5173**

### 4. First Login (1 minute)

1. Open http://localhost:5173 in your browser
2. Click "Login"
3. Use default admin credentials:
   - Email: `admin@hotel.com`
   - Password: `admin123`
4. **IMPORTANT**: Change the admin password immediately using the setup script:
   ```bash
   cd backend
   node scripts/setupAdmin.js
   ```

## Testing the System

### As Admin:
1. Go to Admin Dashboard (`/admin`)
2. Create a new menu category
3. Add food items to the menu
4. View orders and feedback

### As Customer:
1. Register a new account or login
2. Browse the menu at `/menu`
3. Change language to see translations
4. Filter by dietary preferences
5. View food details (ingredients, allergens, spice level)
6. Add items to cart
7. Place an order
8. Submit feedback

## Common Issues

### "Cannot connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify database credentials in `backend/.env`
- Ensure database exists: `psql -U postgres -l | grep hotel_menu_system`

### "CORS error"
- Verify backend is running on port 5000
- Check `CORS_ORIGIN` in `backend/.env` matches frontend URL

### "Authentication failed"
- Clear browser localStorage
- Check JWT_SECRET is set in `backend/.env`
- Verify admin password hash in database

## Next Steps

1. **Change Admin Password**: Use `node backend/scripts/setupAdmin.js`
2. **Add More Foods**: Use Admin Dashboard to add menu items
3. **Add Translations**: Add food translations for different languages
4. **Customize**: Modify colors, branding in `frontend/tailwind.config.js`

## Production Deployment

See `README.md` for production deployment instructions and security considerations.

