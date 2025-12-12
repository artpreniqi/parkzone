const express = require('express');
const auth = require('../middleware/authMiddleware');
const { Reservation, ParkingZone, Vehicle } = require('../models');

const router = express.Router();

// Krijo rezervim të ri
router.post('/', auth, async (req, res) => {
  const { vehicleId, zoneId, start_time, end_time } = req.body;

  try {
    const reservation = await Reservation.create({
      UserId: req.user.id,       // nga tokeni
      VehicleId: vehicleId,
      ParkingZoneId: zoneId,
      start_time,
      end_time,
      status: 'ACTIVE'
    });

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

// Merr rezervimet e përdoruesit të kyçur
router.get('/my', auth, async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { UserId: req.user.id },
      include: [ParkingZone, Vehicle]    // që të kemi emrin e zones + targën
    });

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

module.exports = router;
