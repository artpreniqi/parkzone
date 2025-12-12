module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ParkingZone', {
    name: { type: DataTypes.STRING, allowNull: false },
    location: DataTypes.STRING,
    total_spots: { type: DataTypes.INTEGER, allowNull: false }
  });
};
