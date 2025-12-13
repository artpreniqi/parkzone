module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Reservation', {
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM(
        'PENDING_PAYMENT',
        'ACTIVE',
        'EXPIRED',
        'CANCELLED'
      ),
      
      defaultValue: 'PENDING_PAYMENT',
    },
  });
};
