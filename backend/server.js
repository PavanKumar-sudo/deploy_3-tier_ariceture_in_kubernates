const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const pool = require('./db');

// 🔁 Path to HTML views
const viewsPath = path.join(__dirname, '../frontend/views');

// 🌐 Serve login.html directly from browser to /api/login
router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: viewsPath });
});

// 🌐 Serve signup.html from /api/signup
router.get('/signup', (req, res) => {
  res.sendFile('signup.html', { root: viewsPath });
});

// 📥 Handle POST /api/signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (user.length > 0) {
      return res.send('Username already exists. <a href="/api/signup">Try again</a>');
    }

    await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    res.redirect('/api/login');
  } catch (error) {
    console.error(error);
    res.send('Error during signup.');
  }
});

// 📥 Handle POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (user.length === 0) {
      return res.send('No user found. <a href="/api/login">Try again</a>');
    }

    const match = await bcrypt.compare(password, user[0].password);
    if (!match) {
      return res.send('Incorrect password. <a href="/api/login">Try again</a>');
    }

    req.session.userId = user[0].id;
    res.redirect('/api/dashboard');
  } catch (error) {
    console.error(error);
    res.send('Error during login.');
  }
});

// 🧾 Protected Dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/api/login');
  }
  res.sendFile('dashboard.html', { root: viewsPath });
});

// 🔓 Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/api/login');
  });
});

module.exports = router;
