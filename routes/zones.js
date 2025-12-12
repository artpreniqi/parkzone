const express = require('express');
const { ParkingZone } = require('../models');
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await ParkingZone.findAll());
});

router.post('/', auth, requireRole('ADMIN'), async (req, res) => {
  const zone = await ParkingZone.create(req.body);
  res.json(zone);
});

module.exports = router;
