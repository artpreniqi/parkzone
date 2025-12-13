module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ParkingZone', {
    name: { type: DataTypes.STRING, allowNull: false },
    location: DataTypes.STRING,
    total_spots: { type: DataTypes.INTEGER, allowNull: false },

    price_per_hour: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.5
    },

    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE'
    }
  });
};
