const express = require('express');
const auth = require('../middleware/authMiddleware');
const { User, Role } = require('../models');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { include: Role });
  res.json(user);
});

module.exports = router;
