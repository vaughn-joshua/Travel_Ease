/**
 * BusinessHours Model
 */

export default function defineBusinessHours(sequelize, DataTypes) {
  const BusinessHours = sequelize.define('BusinessHours', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'business',
        key: 'business_id'
      }
    },
    day_of_week: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    open_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    close_time: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    tableName: 'business_hours',
    timestamps: false
  });

  return BusinessHours;
}

