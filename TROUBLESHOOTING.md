# Troubleshooting Guide

## Common Errors and Solutions

### 500 Internal Server Error on Login

#### Symptoms
- Browser console shows: `Failed to load resource: the server responded with a status of 500`
- Login endpoint returns 500 error
- Server logs show errors

#### Common Causes and Solutions

**1. Missing JWT_SECRET in .env file**

**Solution:**
```bash
# Edit backend/.env file
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

Generate a secure secret:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**2. Database Connection Issues**

**Check:**
- Is PostgreSQL running?
- Is DB_PASSWORD set correctly in `.env`?
- Does the database `hotel_menu_system` exist?

**Solution:**
```bash
# Test database connection
cd backend
npm run check-db
```

**3. Missing Environment Variables**

**Solution:**
Create `backend/.env` file with:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173
```

---

### Database Connection Errors

#### Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"

**Cause:** Database password is not set or is not a string

**Solution:**
1. Check `backend/.env` file has `DB_PASSWORD` set
2. Ensure password doesn't have quotes around it
3. Restart the server after updating `.env`

#### Error: "password authentication failed"

**Cause:** Wrong PostgreSQL password

**Solution:**
1. Verify PostgreSQL password
2. Update `DB_PASSWORD` in `.env`
3. Test connection: `npm run check-db`

#### Error: "connection refused"

**Cause:** PostgreSQL is not running

**Solution:**
```bash
# Windows: Check Services
# Press Win+R, type services.msc
# Look for PostgreSQL service and start it

# Linux/Mac
sudo systemctl start postgresql
# Or
brew services start postgresql
```

---

### JWT Token Errors

#### Error: "JWT_SECRET is not set"

**Solution:**
Add to `backend/.env`:
```env
JWT_SECRET=your_long_random_secret_key_here
```

#### Error: "Invalid token"

**Cause:** Token expired or invalid

**Solution:**
- Clear browser localStorage
- Login again
- Check JWT_SECRET matches between server restarts

---

### CORS Errors

#### Error: "Access to fetch blocked by CORS policy"

**Solution:**
1. Check `CORS_ORIGIN` in `backend/.env` matches frontend URL
2. Default should be: `http://localhost:5173`
3. Restart backend server after changing

---

### Frontend Can't Connect to Backend

#### Error: "Failed to fetch" or "Network error"

**Check:**
1. Is backend server running? (Check `http://localhost:5000/health`)
2. Is frontend URL correct in `frontend/src/services/api.js`?
3. Check browser console for specific error

**Solution:**
```bash
# Test backend health
curl http://localhost:5000/health

# Should return: {"status":"OK","message":"Server is running"}
```

---

## Debugging Steps

### 1. Check Server Logs

When you start the backend, you should see:
```
✅ Database connection successful
🚀 Server running on port 5000
📡 Environment: development
🌐 CORS enabled for: http://localhost:5173
```

If you see errors, they will indicate what's wrong.

### 2. Verify Environment Variables

```bash
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET'); console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');"
```

### 3. Test Database Connection

```bash
cd backend
npm run check-db
```

### 4. Test API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Test login (will fail without proper credentials, but should return 400/401, not 500)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## Quick Fix Checklist

When experiencing 500 errors:

- [ ] Check `backend/.env` file exists
- [ ] Verify `JWT_SECRET` is set in `.env`
- [ ] Verify `DB_PASSWORD` is set in `.env`
- [ ] Ensure PostgreSQL is running
- [ ] Verify database `hotel_menu_system` exists
- [ ] Check server console for error messages
- [ ] Restart backend server after changing `.env`
- [ ] Clear browser cache and localStorage
- [ ] Check browser console for detailed error

---

## Getting Help

If errors persist:

1. **Check server logs** - Look for error messages in the terminal where backend is running
2. **Check browser console** - Look for detailed error messages
3. **Run diagnostic script:**
   ```bash
   cd backend
   npm run check-db
   ```
4. **Verify setup:**
   - Database schema is loaded
   - All environment variables are set
   - Both frontend and backend servers are running

---

## Common Solutions Summary

| Error | Quick Fix |
|-------|-----------|
| 500 on login | Set `JWT_SECRET` in `.env` |
| Database connection failed | Check `DB_PASSWORD` in `.env` |
| CORS error | Check `CORS_ORIGIN` in `.env` |
| Token invalid | Clear localStorage and login again |
| Tables not found | Run `database/schema.sql` |

---

## Still Having Issues?

1. **Check the server terminal** - Error messages are logged there
2. **Check browser Network tab** - See the actual request/response
3. **Verify all setup steps** - See `QUICKSTART.md`
4. **Check database** - Ensure schema.sql was run successfully

