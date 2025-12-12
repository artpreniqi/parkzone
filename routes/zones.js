const express = require('express');
const { ParkingZone, Reservation } = require('../models');
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let { start, end } = req.query;

    const now = new Date();
    if (!start) start = now.toISOString();
    if (!end) end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const zones = await ParkingZone.findAll({ order: [['id', 'ASC']] });

    const zonesWithFree = await Promise.all(
      zones.map(async (z) => {
        const reservedCount = await Reservation.count({
          where: {
            ParkingZoneId: z.id,
            status: 'ACTIVE',
            start_time: { [Op.lt]: end },
            end_time: { [Op.gt]: start },
          },
        });

        const freeSpots = Math.max(0, z.total_spots - reservedCount);

        return {
          id: z.id,
          name: z.name,
          location: z.location,
          total_spots: z.total_spots,
          reserved_count: reservedCount,
          free_spots: freeSpots,
          status: z.status,
        };
      })
    );

    res.json({ start, end, zones: zonesWithFree });
  } catch (err) {
    console.error('zones error:', err);
    res.status(500).json({ message: 'Error fetching zones' });
  }
});

router.post('/', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const zone = await ParkingZone.create(req.body);
    res.json(zone);
  } catch (err) {
    console.error('create zone error:', err);
    res.status(500).json({ message: 'Error creating zone' });
  }
});

// UPDATE zone (ADMIN) - edit + activate/deactivate
router.put('/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const zone = await ParkingZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    await zone.update({
      name: req.body.name,
      location: req.body.location,
      total_spots: req.body.total_spots,
      status: req.body.status,
    });

    res.json(zone);
  } catch (err) {
    console.error('update zone error:', err);
    res.status(500).json({ message: 'Error updating zone' });
  }
  
  console.log('UPDATE ZONE BODY:', req.body)

});


module.exports = router;
