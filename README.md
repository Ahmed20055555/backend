# ESDALY Backend API

Backend API for ESDALY E-commerce platform built with Node.js, Express, and MongoDB.

## Features

- 🔐 Authentication & Authorization (JWT)
- 👥 User Management
- 📦 Product Management
- 🛒 Order Management
- ⭐ Product Reviews & Ratings
- 📊 Admin Dashboard
- 📁 File Upload (Images)
- 🔍 Search & Filtering
- 📈 Analytics & Statistics

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- MongoDB connection string
- JWT secret
- Other settings

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Update password

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Orders
- `GET /api/orders` - Get orders (User's orders or all for Admin)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Reviews
- `GET /api/reviews` - Get reviews for a product
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id/helpful` - Mark review as helpful

### Dashboard (Admin)
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/products` - Get products for dashboard

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/esdaly
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## Database Models

- User
- Product
- Category
- Order
- Review

## License

ISC
