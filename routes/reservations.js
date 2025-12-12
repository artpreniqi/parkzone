const express = require('express');
const auth = require('../middleware/authMiddleware');
const { Reservation, ParkingZone, Vehicle } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Krijo rezervim të ri
router.post('/', auth, async (req, res) => {
  const { Reservation, ParkingZone, Vehicle } = require('../models');
  const { vehicleId, zoneId, start_time, end_time } = req.body;

  try {
    const zone = await ParkingZone.findByPk(zoneId);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    const vehicle = await Vehicle.findOne({
      where: { id: vehicleId, UserId: req.user.id },
    });

    if (!vehicle) {
      return res.status(403).json({
        message: 'Nuk mund të rezervosh me një veturë që nuk është e jotja',
      });
    }

    const reservedCount = await Reservation.count({
      where: {
        ParkingZoneId: zoneId,
        status: 'ACTIVE',
        start_time: { [Op.lt]: end_time },
        end_time: { [Op.gt]: start_time },
      },
    });

    const freeSpots = zone.total_spots - reservedCount;

    if (freeSpots <= 0) {
      return res.status(409).json({
        message: 'Nuk ka vende të lira për këtë kohë',
        freeSpots,
      });
    }

    const reservation = await Reservation.create({
      UserId: req.user.id,
      VehicleId: vehicleId,
      ParkingZoneId: zoneId,
      start_time,
      end_time,
      status: 'ACTIVE',
    });

    res.json({ reservation, freeSpotsAfter: freeSpots - 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

// Merr rezervimet e përdoruesit të kyçur (auto-expire)
router.get('/my', auth, async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { UserId: req.user.id },
      include: [ParkingZone, Vehicle],
      order: [['start_time', 'DESC']],
    });

    const now = new Date();
    for (const r of reservations) {
      if (r.status === 'ACTIVE' && new Date(r.end_time) < now) {
        r.status = 'EXPIRED';
        await r.save();
      }
    }

    const updatedReservations = await Reservation.findAll({
      where: { UserId: req.user.id },
      include: [ParkingZone, Vehicle],
      order: [['start_time', 'DESC']],
    });

    res.json(updatedReservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

// availability (mundesh me e lan, po s’na duhet më kur e bojmë te /zones)
router.get('/availability/:zoneId', auth, async (req, res) => {
  const { zoneId } = req.params;
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ message: 'start dhe end janë të detyrueshme' });
  }

  try {
    const zone = await ParkingZone.findByPk(zoneId);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    const reservedCount = await Reservation.count({
      where: {
        ParkingZoneId: zoneId,
        status: 'ACTIVE',
        start_time: { [Op.lt]: end },
        end_time: { [Op.gt]: start },
      },
    });

    const freeSpots = zone.total_spots - reservedCount;

    return res.json({
      zoneId: Number(zoneId),
      totalSpots: zone.total_spots,
      reservedCount,
      freeSpots,
      start,
      end,
    });
  } catch (err) {
    console.error('availability error:', err);
    return res.status(500).json({ message: 'Error checking availability' });
  }
});

module.exports = router;
