// backend/index.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const authRoutes = require('./routes/auth');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false
}));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Mount auth routes at /api
app.use('/api', authRoutes);
app.get('/login', (req, res) => res.redirect('/api/login'));
app.get('/signup', (req, res) => res.redirect('/api/signup'));
app.get('/dashboard', (req, res) => res.redirect('/api/dashboard'));



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
