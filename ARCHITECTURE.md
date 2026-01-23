# Smart Digital Hotel and Restaurant Menu System - Architecture

## System Overview

A comprehensive digital menu system that enhances the dining experience for tourists and local customers by providing detailed food information, multilingual support, and seamless order management.

## Technology Stack

- **Frontend**: React 18+ (Vite), Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi/express-validator

## System Architecture

```
┌─────────────────┐
│   React Client  │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Express API    │
│  (Backend)      │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

## Project Structure

```
digital-menu-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── foodController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   └── feedbackController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Food.js
│   │   ├── Menu.js
│   │   ├── Order.js
│   │   └── Feedback.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── foods.js
│   │   ├── menus.js
│   │   ├── orders.js
│   │   └── feedback.js
│   ├── utils/
│   │   ├── validation.js
│   │   └── constants.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Menu/
│   │   │   ├── Order/
│   │   │   ├── Admin/
│   │   │   └── Common/
│   │   ├── pages/
│   │   │   ├── MenuPage.jsx
│   │   │   ├── OrderPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── database/
    └── schema.sql
```

## Database Schema Design

### Core Entities

1. **Users**: Authentication and role management
2. **Menus**: Menu categories and organization
3. **Foods**: Individual food items
4. **Ingredients**: Food ingredients
5. **Food_Ingredients**: Many-to-many relationship
6. **Orders**: Customer orders
7. **Order_Items**: Items in each order
8. **Feedback**: Customer reviews and feedback
9. **Languages**: Supported languages
10. **Food_Translations**: Multilingual food descriptions

### Key Relationships

- Users → Orders (One-to-Many)
- Menus → Foods (One-to-Many)
- Foods → Ingredients (Many-to-Many)
- Orders → Order_Items (One-to-Many)
- Foods → Order_Items (One-to-Many)
- Users → Feedback (One-to-Many)
- Foods → Feedback (One-to-Many)
- Foods → Food_Translations (One-to-Many)

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Foods
- GET `/api/foods` - Get all foods (with filters)
- GET `/api/foods/:id` - Get food details
- POST `/api/foods` - Create food (Admin)
- PUT `/api/foods/:id` - Update food (Admin)
- DELETE `/api/foods/:id` - Delete food (Admin)

### Menus
- GET `/api/menus` - Get all menus
- GET `/api/menus/:id` - Get menu with foods
- POST `/api/menus` - Create menu (Admin)
- PUT `/api/menus/:id` - Update menu (Admin)
- DELETE `/api/menus/:id` - Delete menu (Admin)

### Orders
- POST `/api/orders` - Create order (Customer)
- GET `/api/orders` - Get orders (Customer/Staff)
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/status` - Update order status (Staff)

### Feedback
- POST `/api/feedback` - Submit feedback (Customer)
- GET `/api/feedback` - Get feedback (Admin/Staff)
- GET `/api/feedback/:id` - Get feedback details

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration

## Scalability Considerations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Efficient query optimization
- Caching strategies for menu data
- API rate limiting
- Environment-based configuration

