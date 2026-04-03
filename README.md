# ⚡ NEXUS COMMERCE — Setup Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (create .env file)
MONGO_URI=mongodb://localhost:27017/nexus_store
PORT=3000
RAZORPAY_KEY=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret

# 3. Place index.html + manifest.json into /public folder
mkdir public && cp index.html manifest.json public/

# 4. Start server
npm run dev     # development (with auto-reload)
npm start       # production
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products (filter, search, sort, page) |
| GET | /api/products/:id | Single product + reviews |
| POST | /api/products | Add product |
| GET | /api/search?q= | Smart search |
| POST | /api/orders | Create order |
| GET | /api/orders/:userId | User orders |
| PATCH | /api/orders/:id/status | Update order status |
| POST | /api/users | Register user |
| GET | /api/users/:id | Get user profile |
| PATCH | /api/users/:id/wishlist | Toggle wishlist |
| POST | /api/users/:id/spin | Spin wheel (gamification) |
| POST | /api/reviews | Post review |
| GET | /api/recommendations/:productId | AI recommendations |
| GET | /api/inventory/:id | Real-time stock check |
| POST | /api/payment/create-order | Razorpay order |
| POST | /api/payment/verify | Verify payment |

## Features Implemented
- ✅ Glassmorphism + Neon dark UI
- ✅ Particle animations + grid background
- ✅ Custom cursor with glow trail
- ✅ Smooth scroll reveals & parallax
- ✅ 3D product card tilt on hover
- ✅ Smart search with voice input
- ✅ Product quick view modal with 360° placeholder
- ✅ Cart sidebar with live totals
- ✅ AI chatbot (frontend NLP)
- ✅ Spin-to-win gamification wheel
- ✅ XP / Badges reward system
- ✅ MongoDB schemas: Products, Orders, Users, Reviews
- ✅ Razorpay payment integration (stub — add your keys)
- ✅ PWA manifest for installable app
- ✅ REST API with filtering, search, pagination

## Razorpay Setup
1. Sign up at https://razorpay.com
2. Get your API keys from Dashboard
3. Add to .env: RAZORPAY_KEY and RAZORPAY_SECRET
4. Uncomment Razorpay code in server.js `/api/payment` routes
