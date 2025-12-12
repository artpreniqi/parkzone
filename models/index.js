const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const Role = require('./Role')(sequelize, Sequelize.DataTypes);
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Vehicle = require('./Vehicle')(sequelize, Sequelize.DataTypes);
const ParkingZone = require('./ParkingZone')(sequelize, Sequelize.DataTypes);
const Reservation = require('./Reservation')(sequelize, Sequelize.DataTypes);

// Relations
Role.hasMany(User);
User.belongsTo(Role);

User.hasMany(Vehicle);
Vehicle.belongsTo(User);

ParkingZone.hasMany(Reservation);
Reservation.belongsTo(ParkingZone);

User.hasMany(Reservation);
Reservation.belongsTo(User);

Vehicle.hasMany(Reservation);
Reservation.belongsTo(Vehicle);

module.exports = {
  sequelize,
  Role,
  User,
  Vehicle,
  ParkingZone,
  Reservation
};
