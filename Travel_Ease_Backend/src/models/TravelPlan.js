/**
 * TravelPlan Model
 */

// Status enum values
export const STATUS_VALUES = ['Draft', 'Active', 'Completed', 'Cancelled'];

export default function defineTravelPlan(sequelize, DataTypes) {
  const TravelPlan = sequelize.define('TravelPlan', {
    travel_plan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    visibility: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    visibility_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...STATUS_VALUES),
      defaultValue: 'Draft'
    },
    max_slots: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    visibility_timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'travel_plan',
    timestamps: false
  });

  return TravelPlan;
}

