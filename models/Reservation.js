module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Reservation', {
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' }
  });
};
