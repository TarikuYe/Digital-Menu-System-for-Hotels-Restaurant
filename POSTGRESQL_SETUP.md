# PostgreSQL Setup Guide - Complete Steps

## Table of Contents
1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Creating the Database](#creating-the-database)
4. [Running the Schema Script](#running-the-schema-script)
5. [Verifying the Setup](#verifying-the-setup)
6. [Common Operations](#common-operations)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### Windows

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer (recommended: PostgreSQL 14 or higher)

2. **Run the Installer:**
   - Double-click the downloaded `.exe` file
   - Follow the installation wizard
   - **Important:** Remember the password you set for the `postgres` superuser
   - Default port: `5432` (keep this unless you have conflicts)
   - Default installation directory: `C:\Program Files\PostgreSQL\[version]`

3. **Verify Installation:**
   - Open Command Prompt or PowerShell
   - Navigate to PostgreSQL bin directory:
     ```bash
     cd "C:\Program Files\PostgreSQL\[version]\bin"
     ```
   - Test connection:
     ```bash
     psql --version
     ```

### macOS

1. **Using Homebrew (Recommended):**
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Or Download Installer:**
   - Visit: https://www.postgresql.org/download/macos/
   - Download and install the `.dmg` file

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

---

## Initial Setup

### 1. Access PostgreSQL

**Windows (Command Prompt):**
```bash
# Add PostgreSQL to PATH (if not already added)
# Or navigate to bin directory:
cd "C:\Program Files\PostgreSQL\[version]\bin"
psql -U postgres
```

**macOS/Linux:**
```bash
sudo -u postgres psql
# Or if you have a user account:
psql -U postgres
```

### 2. Set Password (if needed)

If you need to set or change the postgres user password:
```sql
ALTER USER postgres WITH PASSWORD 'your_secure_password';
\q
```

### 3. Verify PostgreSQL is Running

**Windows:**
- Check Services: Press `Win + R`, type `services.msc`
- Look for "postgresql-x64-[version]" service
- Status should be "Running"

**macOS/Linux:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# Or
pg_isready
```

---

## Creating the Database

### Method 1: Using psql Command Line

1. **Open Command Prompt/Terminal**

2. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres
   ```
   Enter your password when prompted.

3. **Create the Database:**
   ```sql
   CREATE DATABASE hotel_menu_system;
   ```

4. **Verify Database Creation:**
   ```sql
   \l
   ```
   You should see `hotel_menu_system` in the list.

5. **Connect to the Database:**
   ```sql
   \c hotel_menu_system
   ```

6. **Exit psql:**
   ```sql
   \q
   ```

### Method 2: Using pgAdmin (GUI)

1. **Open pgAdmin** (installed with PostgreSQL)

2. **Connect to Server:**
   - Right-click "Servers" → "Create" → "Server"
   - General tab: Name: `PostgreSQL Server`
   - Connection tab:
     - Host: `localhost`
     - Port: `5432`
     - Username: `postgres`
     - Password: (your password)
   - Click "Save"

3. **Create Database:**
   - Expand "Servers" → "PostgreSQL Server" → "Databases"
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `hotel_menu_system`
   - Owner: `postgres`
   - Click "Save"

### Method 3: Using SQL Script

If you already have the database created (as shown in your screenshot), you can skip this step.

---

## Running the Schema Script

### Method 1: Using psql Command Line (Recommended)

1. **Open Command Prompt/Terminal**

2. **Navigate to Project Directory:**
   ```bash
   cd "C:\Users\User\Desktop\Digital Menu"
   ```

3. **Run the Schema Script:**
   ```bash
   psql -U postgres -d hotel_menu_system -f database/schema.sql
   ```
   
   Enter your password when prompted.

   **Alternative (if you're already in psql):**
   ```sql
   \c hotel_menu_system
   \i database/schema.sql
   ```

### Method 2: Using pgAdmin

1. **Open pgAdmin** and connect to your server

2. **Select the Database:**
   - Expand "Servers" → "PostgreSQL Server" → "Databases"
   - Right-click `hotel_menu_system` → "Query Tool"

3. **Open the Schema File:**
   - Click "Open File" icon (folder icon)
   - Navigate to: `C:\Users\User\Desktop\Digital Menu\database\schema.sql`
   - Select and open the file

4. **Execute the Script:**
   - Click the "Execute" button (play icon) or press `F5`
   - Wait for "Query returned successfully" message

### Method 3: Copy-Paste in pgAdmin

1. **Open Query Tool** in pgAdmin (as above)

2. **Open schema.sql** in a text editor

3. **Copy all content** (Ctrl+A, Ctrl+C)

4. **Paste into Query Tool** (Ctrl+V)

5. **Execute** (F5 or Execute button)

---

## Verifying the Setup

### 1. Check Tables Were Created

**Using psql:**
```sql
\c hotel_menu_system
\dt
```

You should see tables like:
- users
- menus
- foods
- ingredients
- food_ingredients
- food_translations
- orders
- order_items
- feedback
- languages

### 2. Check Seed Data

```sql
-- Check languages
SELECT * FROM languages;

-- Check admin user
SELECT email, full_name, role FROM users WHERE role = 'admin';

-- Check menus
SELECT * FROM menus;

-- Check foods
SELECT name, price, spice_level FROM foods LIMIT 5;
```

### 3. Test Database Connection from Node.js

Create a test file `backend/test-db.js`:

```javascript
import pool from './config/database.js';

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    
    // Test a simple query
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Users in database:', userCount.rows[0].count);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run it:
```bash
cd backend
node test-db.js
```

---

## Common Operations

### View All Databases
```sql
\l
```

### Connect to a Database
```sql
\c database_name
```

### List All Tables
```sql
\dt
```

### Describe a Table Structure
```sql
\d table_name
```

### View Table Data
```sql
SELECT * FROM table_name LIMIT 10;
```

### Count Rows in Table
```sql
SELECT COUNT(*) FROM table_name;
```

### Backup Database
```bash
pg_dump -U postgres -d hotel_menu_system -f backup.sql
```

### Restore Database
```bash
psql -U postgres -d hotel_menu_system -f backup.sql
```

### Drop Database (⚠️ WARNING: Deletes everything)
```sql
DROP DATABASE hotel_menu_system;
```

### Create New User
```sql
CREATE USER hotel_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hotel_menu_system TO hotel_admin;
```

---

## Troubleshooting

### Issue 1: "psql: command not found"

**Solution:**
- Add PostgreSQL bin directory to PATH
- Windows: Add `C:\Program Files\PostgreSQL\[version]\bin` to System PATH
- Or use full path: `"C:\Program Files\PostgreSQL\[version]\bin\psql.exe"`

### Issue 2: "password authentication failed"

**Solution:**
1. Check if you're using the correct username
2. Reset password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```
3. Update `backend/.env` with correct password

### Issue 3: "database does not exist"

**Solution:**
```sql
CREATE DATABASE hotel_menu_system;
```

### Issue 4: "permission denied"

**Solution:**
- Make sure you're using the `postgres` superuser
- Or grant permissions:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE hotel_menu_system TO your_username;
  ```

### Issue 5: "connection refused" or "could not connect"

**Solution:**
1. Check if PostgreSQL service is running:
   - Windows: Services → PostgreSQL
   - Linux: `sudo systemctl status postgresql`
2. Check if port 5432 is correct
3. Verify host is `localhost` (not `127.0.0.1` in some cases)

### Issue 6: "relation does not exist"

**Solution:**
- Make sure you ran the schema.sql script
- Verify you're connected to the correct database:
  ```sql
  \c hotel_menu_system
  \dt
  ```

### Issue 7: "syntax error" when running schema.sql

**Solution:**
- Make sure you're using PostgreSQL 12 or higher
- Check for copy-paste errors
- Verify file encoding is UTF-8

### Issue 8: Cannot connect from Node.js

**Solution:**
1. Check `backend/.env` file has correct credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hotel_menu_system
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```
2. Test connection manually:
   ```bash
   psql -U postgres -d hotel_menu_system -h localhost
   ```

---

## Quick Reference Commands

```bash
# Connect to PostgreSQL
psql -U postgres

# Connect to specific database
psql -U postgres -d hotel_menu_system

# Run SQL file
psql -U postgres -d hotel_menu_system -f database/schema.sql

# List all databases
psql -U postgres -c "\l"

# Check PostgreSQL version
psql --version

# Check if PostgreSQL is running
pg_isready
```

---

## Next Steps

After setting up PostgreSQL:

1. ✅ Database created: `hotel_menu_system`
2. ✅ Schema script executed
3. ✅ Tables and seed data loaded
4. ⏭️ Configure backend `.env` file
5. ⏭️ Start backend server
6. ⏭️ Start frontend server

See `QUICKSTART.md` for the complete setup process.

---

## Additional Resources

- **PostgreSQL Official Docs:** https://www.postgresql.org/docs/
- **pgAdmin Documentation:** https://www.pgadmin.org/docs/
- **PostgreSQL Tutorial:** https://www.postgresqltutorial.com/

---

## Security Notes

⚠️ **Important for Production:**

1. **Change Default Password:**
   ```sql
   ALTER USER postgres WITH PASSWORD 'strong_secure_password';
   ```

2. **Create Application User:**
   ```sql
   CREATE USER app_user WITH PASSWORD 'app_password';
   GRANT CONNECT ON DATABASE hotel_menu_system TO app_user;
   GRANT USAGE ON SCHEMA public TO app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   ```

3. **Update .env with Application User:**
   ```env
   DB_USER=app_user
   DB_PASSWORD=app_password
   ```

4. **Restrict Network Access:**
   - Only allow localhost connections in production
   - Use firewall rules
   - Consider SSL connections

---

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Can connect using `psql -U postgres`
- [ ] Database `hotel_menu_system` created
- [ ] Schema script executed successfully
- [ ] All tables visible (`\dt` command)
- [ ] Seed data loaded (languages, admin user, sample foods)
- [ ] Backend can connect (test with `node backend/test-db.js`)
- [ ] `.env` file configured correctly

Once all items are checked, you're ready to run the application! 🚀

