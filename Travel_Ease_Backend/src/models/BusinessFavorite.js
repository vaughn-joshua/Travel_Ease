/**
 * BusinessFavorite Model
 */

export default function defineBusinessFavorite(sequelize, DataTypes) {
  const BusinessFavorite = sequelize.define('BusinessFavorite', {
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
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'business',
        key: 'business_id'
      }
    }
  }, {
    tableName: 'business_favorite',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'business_id'],
        name: 'business_favorite_user_id_business_id_key'
      }
    ]
  });

  return BusinessFavorite;
}

