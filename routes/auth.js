const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const allowedRoles = ['RESIDENT', 'VISITOR'];

    const roleName = allowedRoles.includes(req.body.roleName)
      ? req.body.roleName
      : 'RESIDENT';


    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const role = await Role.findOne({
      where: { name: roleName || 'RESIDENT' }
    });
    if (!role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password_hash: hash,
      RoleId: role.id
    });

    res.status(201).json({
      message: 'User registered',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name
      }
    });
  } catch (err) {
    console.error('Register error: ', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email }, include: Role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error: ', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
