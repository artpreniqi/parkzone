require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, Role } = require('./models');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const zoneRoutes = require('./routes/zones');
const reservationRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');


const app = express();
app.use(cors());
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.json({ message: 'ParkZone API is running' });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/zones', zoneRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/admin', adminRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    // default roles
    const roles = ['ADMIN', 'RESIDENT', 'VISITOR'];
    for (const r of roles) {
      await Role.findOrCreate({ where: { name: r } });
    }

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('ERROR starting server:', err);
  }
}

start();
