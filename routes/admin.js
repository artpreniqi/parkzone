const express = require('express');
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { User, Vehicle, Reservation, ParkingZone } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

/* DASHBOARD STATS */
router.get('/stats', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const now = new Date();

    const [
      users,
      vehicles,
      zones,
      activeReservations,
      expiredReservations,
    ] = await Promise.all([
      User.count(),
      Vehicle.count(),
      ParkingZone.count(),
      Reservation.count({ where: { status: 'ACTIVE' } }),
      Reservation.count({
        where: {
          status: 'EXPIRED',
          end_time: { [Op.lt]: now },
        },
      }),
    ]);

    res.json({
      users,
      vehicles,
      zones,
      activeReservations,
      expiredReservations,
    });
  } catch (err) {
    console.error('ADMIN STATS ERROR:', err);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

/* LATEST RESERVATIONS */
router.get('/reservations', auth, requireRole('ADMIN'), async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  try {
    const reservations = await Reservation.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: ParkingZone },
        { model: Vehicle },
        { model: User, attributes: ['email'] },
      ],
    });

    res.json(reservations);
  } catch (err) {
    console.error('ADMIN RESERVATIONS ERROR:', err);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

module.exports = router;
