/**
 * Activity Model
 */

// Budget range enum values
export const RANGE_VALUES = [
  '0-100',
  '100-200',
  '200-400',
  '400-700',
  '700-1000',
  '1000-1500',
  '1500+'
];

export default function defineActivity(sequelize, DataTypes) {
  const Activity = sequelize.define('Activity', {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    travel_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'travel_plan',
        key: 'travel_plan_id'
      }
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'business',
        key: 'business_id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    budget_range: {
      type: DataTypes.ENUM(...RANGE_VALUES),
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    is_priority: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'activity',
    timestamps: false
  });

  return Activity;
}

