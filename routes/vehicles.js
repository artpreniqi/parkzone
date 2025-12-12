const express = require('express');
const auth = require('../middleware/authMiddleware');
const { Vehicle, Reservation } = require('../models');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ where: { UserId: req.user.id } });
    res.json(vehicles);
  } catch (err) {
    console.error('GET VEHICLES ERROR:', err);
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.create({
      plate_number: req.body.plate_number,
      model: req.body.model,
      color: req.body.color,
      UserId: req.user.id,
    });

    res.json(vehicle);
  } catch (err) {
    console.error('CREATE VEHICLE ERROR:', err);
    res.status(500).json({ message: 'Error creating vehicle' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Veturë nuk u gjet' });
    }

    const activeReservations = await Reservation.count({
      where: { VehicleId: id, status: 'ACTIVE' },
    });

    if (activeReservations > 0) {
      return res.status(409).json({
        message: 'Nuk mund të fshihet – kjo veturë ka rezervim aktiv',
      });
    }

    await vehicle.destroy();
    return res.json({ message: 'Veturë u fshi me sukses' });
  } catch (err) {
    console.error('DELETE VEHICLE ERROR:', err);
    console.error(err?.parent);
    return res.status(500).json({ message: 'Error deleting vehicle' });
  }
});

module.exports = router;
