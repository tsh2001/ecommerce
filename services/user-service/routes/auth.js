const express = require('express');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const User = require('../models/user');
const { generateToken } = require('../utils/jwt');

const router = express.Router();

// Registration Endpoint
router.post('/register', async (req, res) => {
    const { username, name, password, email, contact } = req.body;

    const hashedPassword = await argon2.hash(password, 10);

    const newUser = new User({
        username,
        name,
        password: hashedPassword,
        email,
        contact,
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        const validPassword = await argon2.verify(user.password, password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

        const token = generateToken(user._id);
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Get Logged-In User's Details
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json(user);
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
