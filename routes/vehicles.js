const express = require('express');
const auth = require('../middleware/authMiddleware');
const { Vehicle } = require('../models');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const vehicles = await Vehicle.findAll({ where: { UserId: req.user.id } });
  res.json(vehicles);
});

router.post('/', auth, async (req, res) => {
  const vehicle = await Vehicle.create({
    plate_number: req.body.plate_number,
    model: req.body.model,
    color: req.body.color,
    UserId: req.user.id
  });

  res.json(vehicle);
});

module.exports = router;
