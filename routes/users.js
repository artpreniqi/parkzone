const express = require('express');
const auth = require('../middleware/authMiddleware');
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const { Reservation, Vehicle } = require('../models');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: Role });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET ME ERROR:', err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByPk(req.user.id, { include: Role });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // email unik
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ message: 'Ky email ekziston' });
      user.email = email;
    }

    if (name !== undefined) user.name = name;

    await user.save();
    res.json({ message: 'Profili u përditësua', user });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Duhet currentPassword dhe newPassword' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password duhet min 6 karaktere' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Password aktual është gabim' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password_hash = hash;
    await user.save();

    res.json({ message: 'Password u ndryshua me sukses' });
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
});

router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const blocking = await Reservation.count({
      where: {
        UserId: userId,
        status: ['ACTIVE', 'PENDING_PAYMENT'],
      },
    });

    if (blocking > 0) {
      return res.status(409).json({
        message: 'Nuk mund të fshihet account – ke rezervime ACTIVE / PENDING_PAYMENT',
      });
    }

    await Vehicle.destroy({ where: { UserId: userId } });

    const { User } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();

    return res.json({ message: 'Account u fshi me sukses' });
  } catch (err) {
    console.error('DELETE ACCOUNT ERROR:', err);
    return res.status(500).json({ message: 'Error deleting account' });
  }
});

module.exports = router;
