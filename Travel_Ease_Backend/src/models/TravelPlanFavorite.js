/**
 * TravelPlanFavorite Model
 */

export default function defineTravelPlanFavorite(sequelize, DataTypes) {
  const TravelPlanFavorite = sequelize.define('TravelPlanFavorite', {
    favorite_id: {
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
    }
  }, {
    tableName: 'travel_plan_favorite',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'travel_plan_id'],
        name: 'travel_plan_favorite_user_id_travel_plan_id_key'
      }
    ]
  });

  return TravelPlanFavorite;
}

