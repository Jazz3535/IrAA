// ─────────────────────────────────────────────
//  NEXUS COMMERCE — Node.js + Express + MongoDB
//  Backend API Server
// ─────────────────────────────────────────────

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexus_store';

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend

// ── CONNECT MONGODB ──
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─────────────────────────────────────────────
//  SCHEMAS & MODELS
// ─────────────────────────────────────────────

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  filter: String,
  emoji: String,
  price: Number,
  oldPrice: Number,
  badge: { type: String, enum: ['new','hot','sale'] },
  stars: String,
  reviews: String,
  desc: String,
  stock: { type: Number, default: 0 },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    emoji: String,
    price: Number,
    qty: Number
  }],
  total: Number,
  status: { type: String, enum: ['pending','processing','shipped','delivered'], default: 'pending' },
  address: {
    name: String,
    line1: String,
    city: String,
    state: String,
    pin: String,
    phone: String
  },
  paymentId: String,
  tracking: {
    lat: Number,
    lng: Number,
    updates: [{ message: String, time: Date }]
  },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [String],
  wishlist: [mongoose.Schema.Types.ObjectId],
  cart: [{
    productId: mongoose.Schema.Types.ObjectId,
    qty: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  userId: String,
  rating: Number,
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order   = mongoose.model('Order', orderSchema);
const User    = mongoose.model('User', userSchema);
const Review  = mongoose.model('Review', reviewSchema);

// ─────────────────────────────────────────────
//  SEED DATA (run once)
// ─────────────────────────────────────────────
async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  const seed = [
    { name:"Neural Buds Pro", category:"Audio", filter:"audio", emoji:"🎧", price:4999, oldPrice:7999, badge:"hot", stars:"★★★★★", reviews:"(2.1k)", desc:"Adaptive noise cancellation. 48h battery. Spatial audio.", stock:12 },
    { name:"HoloWatch X", category:"Tech", filter:"tech", emoji:"⌚", price:12999, oldPrice:18999, badge:"new", stars:"★★★★★", reviews:"(890)", desc:"AMOLED holographic display, health monitoring, GPS, LTE.", stock:8 },
    { name:"Cyber Jacket V2", category:"Fashion", filter:"fashion", emoji:"🧥", price:3499, oldPrice:5999, badge:"sale", stars:"★★★★☆", reviews:"(340)", desc:"Temperature-regulating smart fabric with LED accents.", stock:24 },
    { name:"Phantom Console", category:"Gaming", filter:"gaming", emoji:"🎮", price:34999, oldPrice:44999, badge:"hot", stars:"★★★★★", reviews:"(4.5k)", desc:"8K gaming at 240fps. Ray-traced graphics.", stock:5 },
    { name:"NeuralPad Ultra", category:"Tech", filter:"tech", emoji:"📱", price:89999, oldPrice:109999, badge:"new", stars:"★★★★★", reviews:"(1.2k)", desc:"Foldable OLED display, Snapdragon X Elite, 16GB RAM.", stock:15 },
    { name:"Bass Cannon BT", category:"Audio", filter:"audio", emoji:"🔊", price:6999, oldPrice:9999, badge:"sale", stars:"★★★★☆", reviews:"(720)", desc:"360° spatial sound, IPX7 waterproof, 30W output.", stock:30 },
    { name:"Glitch Sneakers", category:"Fashion", filter:"fashion", emoji:"👟", price:8499, oldPrice:12000, badge:"new", stars:"★★★★★", reviews:"(510)", desc:"Self-lacing, step-tracker embedded, eco-foam sole.", stock:18 },
    { name:"VR Abyss Helm", category:"Gaming", filter:"gaming", emoji:"🥽", price:22999, oldPrice:29999, badge:"hot", stars:"★★★★★", reviews:"(3.2k)", desc:"4K per-eye, 120Hz, inside-out tracking.", stock:7 },
  ];
  await Product.insertMany(seed);
  console.log('🌱 Products seeded');
}

// ─────────────────────────────────────────────
//  API ROUTES
// ─────────────────────────────────────────────

// ── PRODUCTS ──
app.get('/api/products', async (req, res) => {
  try {
    const { filter, search, sort, limit=20, page=1 } = req.query;
    let query = {};
    if (filter && filter !== 'all') query.filter = filter;
    if (search) query.name = { $regex: search, $options: 'i' };
    const sortMap = { price_asc:{price:1}, price_desc:{price:-1}, newest:{createdAt:-1} };
    const products = await Product.find(query)
      .sort(sortMap[sort]||{createdAt:-1})
      .limit(+limit).skip((+page-1)*+limit);
    const total = await Product.countDocuments(query);
    res.json({ products, total, page:+page, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if(!p) return res.status(404).json({error:'Not found'});
    const reviews = await Review.find({productId:req.params.id}).sort({createdAt:-1}).limit(10);
    res.json({...p.toObject(), reviews});
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/products', async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch(e) { res.status(400).json({error:e.message}); }
});

// ── SEARCH (smart) ──
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if(!q) return res.json([]);
  try {
    const results = await Product.find({
      $or: [
        {name:{$regex:q,$options:'i'}},
        {category:{$regex:q,$options:'i'}},
        {desc:{$regex:q,$options:'i'}}
      ]
    }).limit(8);
    res.json(results);
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── ORDERS ──
app.post('/api/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    // Update stock
    for(const item of order.items){
      await Product.findByIdAndUpdate(item.productId, { $inc:{stock:-item.qty} });
    }
    // Award XP
    if(order.userId){
      const xpEarned = Math.floor(order.total/100);
      await User.findByIdAndUpdate(order.userId, { $inc:{xp:xpEarned} });
    }
    res.status(201).json(order);
  } catch(e) { res.status(400).json({error:e.message}); }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({userId:req.params.userId}).sort({createdAt:-1});
    res.json(orders);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, {status:req.body.status},{new:true});
    res.json(order);
  } catch(e) { res.status(400).json({error:e.message}); }
});

// ── USERS ──
app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch(e) { res.status(400).json({error:e.message}); }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({error:'Not found'});
    res.json(user);
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.patch('/api/users/:id/wishlist', async (req, res) => {
  try {
    const {productId} = req.body;
    const user = await User.findById(req.params.id);
    const idx = user.wishlist.indexOf(productId);
    if(idx>-1) user.wishlist.splice(idx,1); else user.wishlist.push(productId);
    await user.save();
    res.json(user);
  } catch(e) { res.status(400).json({error:e.message}); }
});

// ── XP & GAMIFICATION ──
app.post('/api/users/:id/spin', async (req, res) => {
  try {
    const prizes = ['5% OFF','10% OFF','FREE SHIP','15% OFF','50 XP','20% OFF','LUCKY BOX','40% OFF'];
    const prize = prizes[Math.floor(Math.random()*prizes.length)];
    const user = await User.findById(req.params.id);
    if(prize==='50 XP') await User.findByIdAndUpdate(req.params.id,{$inc:{xp:50}});
    res.json({prize, user});
  } catch(e) { res.status(400).json({error:e.message}); }
});

// ── REVIEWS ──
app.post('/api/reviews', async (req, res) => {
  try {
    const review = await Review.create(req.body);
    // Award XP for reviewing
    if(req.body.userId) await User.findByIdAndUpdate(req.body.userId, {$inc:{xp:20}});
    res.status(201).json(review);
  } catch(e) { res.status(400).json({error:e.message}); }
});

// ── RECOMMENDATIONS (AI-style: collab filter) ──
app.get('/api/recommendations/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if(!product) return res.json([]);
    const recs = await Product.find({
      filter: product.filter,
      _id: { $ne: product._id }
    }).limit(4);
    res.json(recs);
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── INVENTORY (real-time check) ──
app.get('/api/inventory/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id, 'stock name');
    res.json({ stock: p.stock, inStock: p.stock > 0 });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ── PAYMENT (Razorpay integration stub) ──
app.post('/api/payment/create-order', async (req, res) => {
  try {
    // In production: use Razorpay SDK
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY, key_secret: process.env.RAZORPAY_SECRET });
    // const order = await razorpay.orders.create({ amount: req.body.amount*100, currency:'INR', receipt:`order_${Date.now()}` });
    res.json({
      orderId: `rzp_${Date.now()}`,
      amount: req.body.amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY || 'rzp_test_placeholder',
      message: 'Integrate Razorpay SDK with your credentials'
    });
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/payment/verify', (req, res) => {
  // In production: verify razorpay signature
  // const crypto = require('crypto');
  // const sign = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
  //   .update(req.body.razorpay_order_id + '|' + req.body.razorpay_payment_id).digest('hex');
  // if(sign === req.body.razorpay_signature) { ... }
  res.json({ verified: true, message: 'Payment verification successful' });
});

// ── CATCH ALL → serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ──
app.listen(PORT, async () => {
  await seedProducts();
  console.log(`
╔══════════════════════════════════════╗
║   NEXUS COMMERCE SERVER ONLINE ⚡    ║
║   http://localhost:${PORT}              ║
╚══════════════════════════════════════╝
  `);
});

module.exports = app;
