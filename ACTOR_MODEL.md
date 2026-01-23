# Actor Model - Smart Digital Hotel and Restaurant Menu System

## Document Overview

**System Name:** Smart Digital Hotel and Restaurant Menu System  
**Version:** 2.0  
**Date:** January 23, 2026  
**Purpose:** Define all actors (human and system) and their responsibilities within the digital menu ecosystem

---

## System Context

The system is designed for hotels and restaurants serving local and international tourists, with features such as:
- Digital menus accessible via QR codes
- Ingredient transparency and allergen warnings
- Spice-level indicators
- Multilingual support
- Order placement and tracking
- Payment processing
- Feedback and ratings
- Analytics and reporting

---

## Actor Categories

### 1. Primary Actors (Human Users)
- Customer / Tourist
- Waiter / Service Staff
- Kitchen Staff / Chef
- Cashier
- Restaurant Manager
- System Administrator
- Hotel / Restaurant Owner

### 2. System Actors (External Systems)
- Payment Gateway
- Analytics / AI Engine
- Notification Service

---

## Detailed Actor Specifications

### 1. Customer / Tourist

**Role:** `customer`  
**Access Level:** Basic User  
**Primary Goal:** Browse menu, order food, track orders, provide feedback

#### Responsibilities:
- ✅ View digital menu via QR code (table-specific session)
- ✅ Browse food items with multilingual support
- ✅ Check food ingredients, nutritional information, and allergens
- ✅ View spice levels (0-5 scale) with visual indicators
- ✅ Filter menu by dietary preferences (vegetarian, vegan, gluten-free)
- ✅ Search for specific dishes
- ✅ Add items to cart
- ✅ Place food orders with special instructions
- ✅ Track order status in real-time (pending → confirmed → preparing → ready → served)
- ✅ View order history
- ✅ Provide ratings (1-5 stars) and written feedback
- ✅ View digital receipts
- 🔄 Make payments (cash or digital)
- 🔄 Receive notifications (order status updates)

#### User Stories:
1. As a tourist, I want to view the menu in my native language so I can understand what I'm ordering
2. As a customer with allergies, I want to see allergen warnings clearly displayed
3. As a customer who dislikes spicy food, I want to filter by spice level
4. As a customer, I want to track my order status so I know when my food will arrive
5. As a satisfied customer, I want to leave a rating and review

#### Database Interactions:
- **Read:** foods, menus, ingredients, food_translations, languages, orders, order_items, feedback
- **Write:** orders, order_items, feedback, guest_sessions (for non-registered users)

#### Current Implementation Status:
- ✅ Menu browsing with filters
- ✅ Order placement
- ✅ Order tracking
- ✅ Feedback submission
- 🔄 Guest sessions (migration_v2.sql ready)
- 🔄 Real-time notifications

---

### 2. Waiter / Service Staff

**Role:** `staff`  
**Access Level:** Service Operations  
**Primary Goal:** Assist customers, manage table orders, coordinate with kitchen

#### Responsibilities:
- ✅ Assist customers with ordering (in-person or via system)
- ✅ View all active orders for assigned tables
- ✅ Confirm customer orders
- ✅ Update order status
- ✅ Manage table assignments and status
- ✅ Communicate special customer requests to kitchen
- ✅ Notify customers when orders are ready
- ✅ Handle customer complaints and feedback
- 🔄 Process table turnover (mark tables as dirty/available)
- 🔄 View customer feedback for service improvement

#### User Stories:
1. As a waiter, I want to see all orders for my assigned tables
2. As a waiter, I want to confirm orders before sending to kitchen
3. As a waiter, I want to update order status when serving food
4. As a waiter, I want to communicate special dietary requests to the kitchen
5. As a waiter, I want to know which tables need attention

#### Database Interactions:
- **Read:** orders, order_items, foods, restaurant_tables, users (customers)
- **Write:** orders (status updates), order_status_logs, restaurant_tables (status)

#### Current Implementation Status:
- ✅ Order viewing and status updates
- 🔄 Table management (migration_v2.sql ready)
- 🔄 Staff assignment system

---

### 3. Kitchen Staff / Chef

**Role:** `staff` (specialized)  
**Access Level:** Kitchen Operations  
**Primary Goal:** Prepare orders efficiently, maintain quality standards

#### Responsibilities:
- ✅ View incoming orders in real-time
- ✅ See order details (items, quantities, special instructions)
- ✅ Update cooking status (confirmed → preparing → ready)
- ✅ Mark dishes as ready for service
- ✅ View preparation time estimates
- 🔄 Notify waiters when orders are ready
- 🔄 Update food availability status (out of stock)
- 🔄 View kitchen performance metrics (prep times, order volume)
- 🔄 Manage recipe ingredients

#### User Stories:
1. As a chef, I want to see all pending orders in order of priority
2. As a chef, I want to view special instructions for each order
3. As a chef, I want to mark items as ready when cooking is complete
4. As a chef, I want to mark ingredients as unavailable when stock runs low
5. As a chef, I want to see average preparation times to improve efficiency

#### Database Interactions:
- **Read:** orders, order_items, foods, ingredients, food_ingredients
- **Write:** orders (status: preparing, ready), order_status_logs, foods (is_available, avg_actual_prep_time)

#### Current Implementation Status:
- ✅ Order viewing and status updates
- 🔄 Kitchen display system (KDS)
- 🔄 Preparation time tracking (migration_v2.sql ready)
- 🔄 Inventory management integration

---

### 4. Cashier

**Role:** `staff` (specialized)  
**Access Level:** Payment Operations  
**Primary Goal:** Process payments, generate receipts, close orders

#### Responsibilities:
- ✅ View completed orders awaiting payment
- ✅ Process cash payments
- 🔄 Process digital payments (card, mobile wallet)
- 🔄 Generate digital receipts
- 🔄 Generate printed receipts
- ✅ Confirm payment completion
- ✅ Mark orders as served/completed
- 🔄 Handle payment disputes
- 🔄 Process refunds
- 🔄 View daily payment summary
- 🔄 Reconcile cash drawer

#### User Stories:
1. As a cashier, I want to see all orders ready for payment
2. As a cashier, I want to process multiple payment methods
3. As a cashier, I want to generate receipts automatically
4. As a cashier, I want to handle split payments for group orders
5. As a cashier, I want to view my daily transaction summary

#### Database Interactions:
- **Read:** orders, order_items, foods, users (customers)
- **Write:** orders (status: served, payment_status), payments (new table needed), receipts (new table needed)

#### Current Implementation Status:
- ✅ Order viewing
- 🔄 Payment processing system
- 🔄 Receipt generation
- 🔄 Payment gateway integration

#### Required Database Extensions:
```sql
-- Payments table (to be added)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'mobile', 'digital_wallet'
    amount DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5. Restaurant Manager

**Role:** `manager` (new role needed)  
**Access Level:** Operational Management  
**Primary Goal:** Oversee daily operations, monitor performance, ensure quality

#### Responsibilities:
- 🔄 Monitor real-time order flow and kitchen status
- 🔄 View staff performance metrics
- 🔄 Manage staff schedules and assignments
- 🔄 View daily sales reports
- 🔄 Monitor customer feedback and ratings
- 🔄 Analyze menu item performance
- 🔄 Handle customer complaints and escalations
- 🔄 Approve special discounts or refunds
- 🔄 View inventory levels and alerts
- 🔄 Generate operational reports (daily, weekly, monthly)
- 🔄 Monitor table turnover rates
- 🔄 View peak hours and staffing needs

#### User Stories:
1. As a manager, I want to see real-time dashboard of all operations
2. As a manager, I want to identify best-selling and underperforming menu items
3. As a manager, I want to monitor staff efficiency
4. As a manager, I want to respond to negative customer feedback quickly
5. As a manager, I want to optimize table assignments during peak hours

#### Database Interactions:
- **Read:** All tables (comprehensive access)
- **Write:** users (staff management), foods (availability, pricing), menus, feedback (visibility, responses)

#### Current Implementation Status:
- 🔄 Manager role not yet implemented
- 🔄 Dashboard and analytics needed
- 🔄 Staff management module needed

#### Required Database Extensions:
```sql
-- Update user roles to include manager
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'staff', 'kitchen', 'cashier', 'customer'));

-- Staff schedules table
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    role VARCHAR(50), -- 'waiter', 'chef', 'cashier'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 6. System Administrator

**Role:** `admin`  
**Access Level:** Full System Access  
**Primary Goal:** Manage system configuration, users, and content

#### Responsibilities:
- ✅ Manage user accounts and roles
- ✅ Add, update, and delete menu categories
- ✅ Add, update, and delete food items
- ✅ Manage ingredients and allergen information
- ✅ Configure spice levels and dietary tags
- ✅ Add and manage food translations
- ✅ Configure supported languages
- ✅ Set food prices and availability
- ✅ Manage feedback visibility
- 🔄 Configure system settings (tax rates, service charges)
- 🔄 Manage QR codes for tables
- 🔄 Configure payment gateway settings
- 🔄 Manage restaurant branches (multi-location)
- 🔄 View system logs and audit trails
- 🔄 Backup and restore data

#### User Stories:
1. As an admin, I want to add new menu items with full details
2. As an admin, I want to manage user roles and permissions
3. As an admin, I want to configure multilingual content
4. As an admin, I want to generate QR codes for new tables
5. As an admin, I want to view system health and performance

#### Database Interactions:
- **Read:** All tables (full access)
- **Write:** All tables (full access)

#### Current Implementation Status:
- ✅ User management
- ✅ Menu and food management
- ✅ Ingredient management
- ✅ Translation management
- 🔄 QR code generation (migration_v2.sql ready)
- 🔄 Multi-branch support
- 🔄 System configuration panel

---

### 7. Hotel / Restaurant Owner

**Role:** `owner` (new role needed)  
**Access Level:** Strategic Management  
**Primary Goal:** Make strategic decisions, view business analytics, monitor revenue

#### Responsibilities:
- 🔄 View comprehensive business analytics dashboard
- 🔄 Monitor revenue and profit margins
- 🔄 View sales trends and forecasts
- 🔄 Analyze customer demographics and preferences
- 🔄 View menu item profitability
- 🔄 Monitor customer satisfaction scores
- 🔄 View competitor analysis (if integrated)
- 🔄 Make strategic pricing decisions
- 🔄 Manage multiple branches/locations
- 🔄 View staff performance across locations
- 🔄 Export financial reports
- 🔄 Set business goals and KPIs

#### User Stories:
1. As an owner, I want to see total revenue across all branches
2. As an owner, I want to identify most profitable menu items
3. As an owner, I want to analyze customer retention rates
4. As an owner, I want to compare performance across different locations
5. As an owner, I want to make data-driven menu decisions

#### Database Interactions:
- **Read:** All tables (analytics and reporting focus)
- **Write:** Limited (strategic configurations only)

#### Current Implementation Status:
- 🔄 Owner role not yet implemented
- 🔄 Analytics dashboard needed
- 🔄 Multi-branch architecture needed

#### Required Database Extensions:
```sql
-- Branches table for multi-location support
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link users to branches
ALTER TABLE users ADD COLUMN branch_id UUID REFERENCES branches(id);

-- Link tables to branches
ALTER TABLE restaurant_tables ADD COLUMN branch_id UUID REFERENCES branches(id);
```

---

## System Actors (External Systems)

### 8. Payment Gateway

**Type:** External System Actor  
**Integration:** API-based  
**Primary Goal:** Process secure digital payments

#### Responsibilities:
- 🔄 Process credit/debit card payments
- 🔄 Process mobile wallet payments (Apple Pay, Google Pay)
- 🔄 Handle payment authentication and authorization
- 🔄 Send payment confirmation/failure notifications
- 🔄 Process refunds and chargebacks
- 🔄 Provide transaction receipts
- 🔄 Ensure PCI DSS compliance
- 🔄 Handle currency conversions (for international tourists)

#### Integration Points:
- **Trigger:** Customer initiates payment
- **Input:** Order ID, amount, payment method, customer details
- **Output:** Transaction ID, payment status, receipt data
- **Callback:** Payment confirmation webhook

#### Recommended Providers:
- Stripe
- PayPal
- Square
- Local payment processors (country-specific)

#### Current Implementation Status:
- 🔄 Not yet implemented
- 🔄 API integration needed
- 🔄 Webhook handlers needed

---

### 9. Analytics / AI Engine

**Type:** External System Actor  
**Integration:** API-based / Embedded  
**Primary Goal:** Provide insights, recommendations, and sentiment analysis

#### Responsibilities:
- 🔄 Analyze customer feedback sentiment
- 🔄 Generate personalized food recommendations
- 🔄 Predict popular items based on trends
- 🔄 Identify customer preferences and patterns
- 🔄 Forecast demand for inventory planning
- 🔄 Detect anomalies (unusual orders, potential fraud)
- 🔄 Generate business intelligence reports
- 🔄 Provide multilingual translation suggestions
- 🔄 Analyze menu item performance

#### Integration Points:
- **Trigger:** Scheduled jobs, real-time events
- **Input:** Order history, feedback data, customer behavior
- **Output:** Recommendations, sentiment scores, analytics reports
- **Frequency:** Real-time and batch processing

#### Technologies:
- Natural Language Processing (NLP) for sentiment analysis
- Machine Learning for recommendations
- Business Intelligence tools (Tableau, Power BI)
- Custom analytics engine

#### Current Implementation Status:
- 🔄 Sentiment score field exists in feedback table
- 🔄 AI integration not implemented
- 🔄 Analytics dashboard needed

---

### 10. Notification Service

**Type:** External System Actor  
**Integration:** API-based  
**Primary Goal:** Send timely notifications to users

#### Responsibilities:
- 🔄 Send email notifications
- 🔄 Send SMS notifications
- 🔄 Send push notifications (mobile app)
- 🔄 Send in-app notifications
- 🔄 Notify customers of order status changes
- 🔄 Notify staff of new orders
- 🔄 Notify kitchen of special requests
- 🔄 Send promotional messages (with consent)
- 🔄 Send payment receipts
- 🔄 Send feedback requests

#### Notification Types:

| Event | Recipient | Channel | Priority |
|-------|-----------|---------|----------|
| Order Placed | Kitchen Staff | In-app, SMS | High |
| Order Confirmed | Customer | Email, In-app | Medium |
| Order Ready | Customer, Waiter | In-app, SMS | High |
| Payment Successful | Customer | Email, SMS | Medium |
| Feedback Request | Customer | Email | Low |
| New Reservation | Manager | Email, In-app | Medium |

#### Integration Points:
- **Trigger:** System events (order status change, payment, etc.)
- **Input:** User contact info, message template, notification type
- **Output:** Delivery status, read receipts
- **Providers:** Twilio (SMS), SendGrid (Email), Firebase (Push)

#### Current Implementation Status:
- 🔄 Not yet implemented
- 🔄 Notification service needed
- 🔄 Template management needed

---

## Role-Based Access Control (RBAC) Matrix

| Feature | Customer | Staff | Kitchen | Cashier | Manager | Admin | Owner |
|---------|----------|-------|---------|---------|---------|-------|-------|
| View Menu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Place Order | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| View Own Orders | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Orders | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update Order Status | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Process Payment | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Submit Feedback | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Feedback | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Menu | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Branches | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Actor Interaction Flows

### Flow 1: Customer Orders Food

```
1. Customer scans QR code → Guest Session Created
2. Customer browses menu → Menu Service
3. Customer adds items to cart → Cart Service
4. Customer places order → Order Service
5. System notifies Kitchen Staff → Notification Service
6. Kitchen Staff confirms order → Order Status: Confirmed
7. Kitchen Staff prepares food → Order Status: Preparing
8. Kitchen Staff marks ready → Order Status: Ready
9. System notifies Waiter → Notification Service
10. Waiter serves food → Order Status: Served
11. Customer pays → Payment Gateway → Cashier
12. System generates receipt → Receipt Service
13. Customer provides feedback → Feedback Service
```

### Flow 2: Admin Adds New Menu Item

```
1. Admin logs in → Authentication Service
2. Admin navigates to menu management → Admin Dashboard
3. Admin creates food item → Food Service
4. Admin adds ingredients → Ingredient Service
5. Admin sets allergens and dietary tags → Food Service
6. Admin adds translations → Translation Service
7. Admin uploads image → Image Service (future)
8. Admin sets price and availability → Food Service
9. System updates menu → Menu Service
10. Customers see new item → Menu Display
```

### Flow 3: Manager Reviews Performance

```
1. Manager logs in → Authentication Service
2. Manager views dashboard → Analytics Service
3. System aggregates order data → Analytics Engine
4. System calculates metrics → Analytics Engine
5. Manager views sales report → Reporting Service
6. Manager views customer feedback → Feedback Service
7. Manager identifies issues → Decision Support
8. Manager adjusts operations → Management Actions
```

---

## Implementation Roadmap

### Phase 1: Core Actors (Current - ✅ Mostly Complete)
- ✅ Customer
- ✅ Admin
- ✅ Staff (basic)

### Phase 2: Specialized Roles (In Progress - 🔄)
- 🔄 Kitchen Staff (specialized interface)
- 🔄 Cashier (payment processing)
- 🔄 Guest Sessions (QR code access)

### Phase 3: Management Layer (Planned)
- 🔄 Restaurant Manager
- 🔄 Analytics Dashboard
- 🔄 Performance Metrics

### Phase 4: Strategic Layer (Future)
- 🔄 Owner Role
- 🔄 Multi-branch Support
- 🔄 Advanced Analytics

### Phase 5: External Integrations (Future)
- 🔄 Payment Gateway
- 🔄 Notification Service
- 🔄 AI/Analytics Engine

---

## Database Schema Updates Required

### New Roles to Add:
```sql
-- Update user roles constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'owner', 'manager', 'staff', 'kitchen', 'cashier', 'customer'));
```

### New Tables Needed:
1. ✅ `restaurant_tables` - Already in migration_v2.sql
2. ✅ `guest_sessions` - Already in migration_v2.sql
3. ✅ `order_status_logs` - Already in migration_v2.sql
4. 🔄 `payments` - Payment processing
5. 🔄 `receipts` - Receipt generation
6. 🔄 `branches` - Multi-location support
7. 🔄 `staff_schedules` - Staff management
8. 🔄 `notifications` - Notification tracking
9. 🔄 `system_settings` - Configuration management

---

## Constraints and Design Principles

### 1. Role-Based Access Control (RBAC)
- ✅ All endpoints must check user roles
- ✅ Middleware enforces authorization
- ✅ Database constraints prevent unauthorized access

### 2. Real-World Workflow Alignment
- ✅ Order flow matches restaurant operations
- ✅ Status transitions follow logical sequence
- ✅ Staff roles match actual job functions

### 3. Scalability
- ✅ Database indexing for performance
- ✅ Pagination for large datasets
- 🔄 Multi-branch architecture
- 🔄 Horizontal scaling support

### 4. Multi-Branch Operations
- 🔄 Branch-specific data isolation
- 🔄 Centralized reporting
- 🔄 Branch-level user assignments

### 5. Security
- ✅ JWT authentication
- ✅ Password hashing
- ✅ SQL injection prevention
- 🔄 PCI DSS compliance for payments
- 🔄 Data encryption at rest

---

## Conclusion

This actor model provides a comprehensive framework for the Smart Digital Hotel and Restaurant Menu System. It defines:

- **7 Human Actors** with clear responsibilities
- **3 System Actors** for external integrations
- **RBAC Matrix** for access control
- **Interaction Flows** for key scenarios
- **Implementation Roadmap** for phased development

### Current Status:
- ✅ **Phase 1 Complete:** Core customer and admin functionality
- 🔄 **Phase 2 In Progress:** Specialized roles and guest sessions
- 🔄 **Phases 3-5 Planned:** Management, analytics, and integrations

### Next Steps:
1. Run `migration_v2.sql` to add table management and guest sessions
2. Implement specialized role interfaces (Kitchen, Cashier)
3. Add Manager and Owner roles with analytics dashboard
4. Integrate payment gateway
5. Implement notification service
6. Add AI-powered analytics and recommendations

---

**Document Version:** 1.0  
**Last Updated:** January 23, 2026  
**Maintained By:** System Administrator
