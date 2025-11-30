/**
 * TravelPlanReview Model
 */

export default function defineTravelPlanReview(sequelize, DataTypes) {
  const TravelPlanReview = sequelize.define('TravelPlanReview', {
    review_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    travel_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'travel_plan',
        key: 'travel_plan_id'
      }
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    review_date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'travel_plan_review',
    timestamps: false
  });

  return TravelPlanReview;
}

