# Quick .env Setup Instructions

## ✅ Your .env File Should Contain:

Copy and paste this into `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=Tare@kiya
JWT_SECRET=bBPe1QCOywKQmX3NLBxr0HztQILoic1Wq1p7oACdgrs=
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

## 🚀 Three Ways to Create It:

### Method 1: Use PowerShell Script (Easiest)
```powershell
cd backend
.\setup-env.ps1
```

### Method 2: Manual Creation
1. Open Notepad or any text editor
2. Copy the content above
3. Save as `.env` in the `backend` folder
4. Make sure it's named `.env` (not `.env.txt`)

### Method 3: Copy Template
```powershell
cd backend
Copy-Item env-template.txt .env
# Then edit .env and update DB_PASSWORD if needed
```

## ✅ Verify It Works:

After creating `.env`, run:
```powershell
node check-env.js
```

You should see all ✅ green checkmarks!

## 🔧 If Your PostgreSQL Password is Different:

Edit `backend/.env` and change:
```
DB_PASSWORD=your_actual_postgres_password
```

## 🎯 That's It!

Once `.env` is set up correctly:
1. Restart your backend server
2. The 500 error should be fixed
3. Login should work!

---

**Need help?** Check `ENV_SETUP.md` for detailed instructions.

