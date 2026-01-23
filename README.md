# Smart Digital Hotel and Restaurant Menu System

A comprehensive digital menu system designed to enhance the dining experience for tourists and local customers by providing detailed food information, multilingual support, and seamless order management.

## Features

- 🌍 **Multilingual Support**: Menu items available in multiple languages (English, Spanish, French, Chinese, Arabic, German)
- 🌶️ **Spice Level Indicators**: Visual spice level indicators (0-5) with emoji representations
- ⚠️ **Allergen Warnings**: Clear allergen information for each dish
- 🥗 **Dietary Filters**: Filter by vegetarian, vegan, and gluten-free options
- 📱 **Digital Menu**: QR code accessible menu with detailed ingredient information
- 🛒 **Order Management**: Complete order placement and tracking system
- 👥 **Role-Based Access**: Admin, Staff, and Customer roles with appropriate permissions
- 💬 **Feedback System**: Customer feedback and rating system
- 📊 **Admin Dashboard**: Comprehensive admin panel for menu and order management

## Documentation

- 📋 **[Actor Model](ACTOR_MODEL.md)**: Complete specification of all system actors and their responsibilities
- ✅ **[Implementation Checklist](ACTOR_MODEL_IMPLEMENTATION_CHECKLIST.md)**: Track development progress across all phases
- 🔐 **[RBAC Reference](RBAC_REFERENCE.md)**: Role-based access control implementation guide
- 🏗️ **[Architecture](ARCHITECTURE.md)**: System architecture and design
- 🚀 **[Quick Start](QUICKSTART.md)**: Get started quickly
- 🔧 **[Troubleshooting](TROUBLESHOOTING.md)**: Common issues and solutions


## Technology Stack

### Frontend
- **React 18+** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing

## Project Structure

```
digital-menu-system/
├── backend/              # Node.js + Express backend
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & error handling
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   ├── services/    # API services
│   │   └── utils/       # Utilities
│   └── package.json
│
└── database/            # Database scripts
    └── schema.sql       # Database schema
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation & Setup

### 1. Database Setup

1. Ensure PostgreSQL is running and you have created the database `hotel_menu_system`

2. Run the schema script:
```bash
psql -U postgres -d hotel_menu_system -f database/schema.sql
```

Or using psql directly:
```bash
psql -U postgres -d hotel_menu_system
\i database/schema.sql
```

**Note**: The default admin user is created with:
- Email: `admin@hotel.com`
- Password: `admin123` (CHANGE THIS IN PRODUCTION!)

To set a proper password hash, you can use Node.js:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('your_password', 10).then(hash => console.log(hash));
```

Then update the `users` table:
```sql
UPDATE users SET password_hash = 'your_hashed_password' WHERE email = 'admin@hotel.com';
```

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_menu_system
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults are set):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Foods
- `GET /api/foods` - Get all foods (with filters)
- `GET /api/foods/:id` - Get food details
- `POST /api/foods` - Create food (Admin only)
- `PUT /api/foods/:id` - Update food (Admin only)
- `DELETE /api/foods/:id` - Delete food (Admin only)

### Menus
- `GET /api/menus` - Get all menus
- `GET /api/menus/:id` - Get menu with foods
- `POST /api/menus` - Create menu (Admin only)
- `PUT /api/menus/:id` - Update menu (Admin only)
- `DELETE /api/menus/:id` - Delete menu (Admin only)

### Orders
- `POST /api/orders` - Create order (Customer)
- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (Staff/Admin)

### Feedback
- `POST /api/feedback` - Submit feedback (Customer)
- `GET /api/feedback` - Get feedback
- `GET /api/feedback/:id` - Get feedback details
- `PUT /api/feedback/:id/visibility` - Update visibility (Admin)

## Usage

### For Customers

1. **Browse Menu**: Visit `/menu` to view the digital menu
2. **Select Language**: Use the language selector to view menu in your preferred language
3. **Filter Options**: Use filters for dietary preferences (vegetarian, vegan, gluten-free)
4. **View Details**: Click "Details" to see full ingredient list and allergen information
5. **Add to Cart**: Click "Add to Cart" (requires login)
6. **Place Order**: Go to "My Orders" to review cart and place order
7. **Track Orders**: View order status and history

### For Staff

1. **View Orders**: Access all customer orders
2. **Update Status**: Change order status (pending → confirmed → preparing → ready → served)
3. **View Feedback**: See customer feedback and ratings

### For Administrators

1. **Manage Menus**: Create, edit, and delete menu categories
2. **Manage Foods**: Add, edit, and delete food items with ingredients
3. **Manage Orders**: View and update all orders
4. **Manage Feedback**: View and moderate customer feedback

## Database Schema

### Key Tables

- **users**: User accounts with role-based access
- **menus**: Menu categories
- **foods**: Food items with details (price, spice level, dietary info)
- **ingredients**: Ingredient master list
- **food_ingredients**: Many-to-many relationship between foods and ingredients
- **food_translations**: Multilingual food descriptions
- **orders**: Customer orders
- **order_items**: Items in each order
- **feedback**: Customer reviews and ratings
- **languages**: Supported languages

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation
- SQL injection prevention (parameterized queries)
- CORS configuration

## Production Deployment

### Important Security Steps

1. **Change Default Admin Password**: Update the admin password hash in the database
2. **Set Strong JWT Secret**: Use a strong, random JWT secret
3. **Environment Variables**: Never commit `.env` files
4. **Database Security**: Use strong database passwords and restrict access
5. **HTTPS**: Always use HTTPS in production
6. **Rate Limiting**: Consider adding rate limiting for API endpoints
7. **Input Sanitization**: Additional input sanitization may be needed

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

## Future Enhancements

- [ ] Real-time order updates using WebSockets
- [ ] QR code generation for tables
- [ ] Image upload for food items
- [ ] Sentiment analysis on feedback (AI integration)
- [ ] Email notifications for order status
- [ ] Payment integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `hotel_menu_system` exists

### CORS Errors
- Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
- Check that backend is running on correct port

### Authentication Issues
- Verify JWT_SECRET is set in backend `.env`
- Check token expiration settings
- Clear browser localStorage if needed

## License

This project is open source and available for use.

## Support

For issues or questions, please create an issue in the repository.

