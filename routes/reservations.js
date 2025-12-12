const express = require('express');
const auth = require('../middleware/authMiddleware');
const { Reservation } = require('../models');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const reservation = await Reservation.create({
    UserId: req.user.id,
    VehicleId: req.body.vehicleId,
    ParkingZoneId: req.body.zoneId,
    start_time: req.body.start_time,
    end_time: req.body.end_time
  });

  res.json(reservation);
});

module.exports = router;
