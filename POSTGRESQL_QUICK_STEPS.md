# PostgreSQL Quick Steps - Cheat Sheet

## 🚀 Quick Setup (5 Steps)

### Step 1: Verify PostgreSQL is Running
```bash
# Check if PostgreSQL is installed
psql --version

# Check if service is running (Windows)
# Open Services (Win+R → services.msc) → Look for PostgreSQL

# Check if service is running (Linux/Mac)
pg_isready
```

### Step 2: Connect to PostgreSQL
```bash
psql -U postgres
# Enter password when prompted
```

### Step 3: Create Database (if not exists)
```sql
CREATE DATABASE hotel_menu_system;
\q
```

### Step 4: Run Schema Script
```bash
# From project root directory
cd "C:\Users\User\Desktop\Digital Menu"
psql -U postgres -d hotel_menu_system -f database/schema.sql
```

### Step 5: Verify Setup
```bash
psql -U postgres -d hotel_menu_system
```
```sql
\dt                    -- List all tables
SELECT * FROM users;   -- Check admin user
SELECT * FROM languages; -- Check languages
\q
```

---

## 📋 Common Commands

### Connection
```bash
# Connect to PostgreSQL
psql -U postgres

# Connect to specific database
psql -U postgres -d hotel_menu_system

# Connect with host and port
psql -U postgres -h localhost -p 5432 -d hotel_menu_system
```

### Database Operations
```sql
-- List all databases
\l

-- Connect to database
\c hotel_menu_system

-- List all tables
\dt

-- Describe table structure
\d table_name

-- Exit psql
\q
```

### Running SQL Files
```bash
# Method 1: Command line
psql -U postgres -d hotel_menu_system -f database/schema.sql

# Method 2: From within psql
\c hotel_menu_system
\i database/schema.sql
```

---

## 🔧 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| `psql: command not found` | Add PostgreSQL bin to PATH or use full path |
| `password authentication failed` | Check password in `.env` or reset: `ALTER USER postgres WITH PASSWORD 'newpass';` |
| `database does not exist` | Create it: `CREATE DATABASE hotel_menu_system;` |
| `connection refused` | Check PostgreSQL service is running |
| `permission denied` | Use `postgres` user or grant permissions |

---

## ✅ Verification Queries

```sql
-- Check database exists
SELECT datname FROM pg_database WHERE datname = 'hotel_menu_system';

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check admin user
SELECT email, role FROM users WHERE role = 'admin';

-- Check seed data
SELECT COUNT(*) FROM languages;
SELECT COUNT(*) FROM foods;
SELECT COUNT(*) FROM menus;
```

---

## 🎯 Complete Setup in One Go

```bash
# 1. Connect and create database
psql -U postgres -c "CREATE DATABASE hotel_menu_system;"

# 2. Run schema script
psql -U postgres -d hotel_menu_system -f database/schema.sql

# 3. Verify
psql -U postgres -d hotel_menu_system -c "\dt"
```

---

## 📝 For Your Project

Since you already have the database created (as shown in your pgAdmin screenshot), you just need to:

1. **Run the schema script:**
   ```bash
   psql -U postgres -d hotel_menu_system -f database/schema.sql
   ```

2. **Or use pgAdmin:**
   - Right-click `hotel_menu_system` → Query Tool
   - Open `database/schema.sql`
   - Execute (F5)

3. **Verify it worked:**
   ```sql
   \dt  -- Should show 10+ tables
   ```

That's it! 🎉

