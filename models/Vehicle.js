module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Vehicle', {
    plate_number: { type: DataTypes.STRING, allowNull: false },
    model: DataTypes.STRING,
    color: DataTypes.STRING
  });
};
