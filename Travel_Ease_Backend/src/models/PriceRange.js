/**
 * PriceRange Model
 */

export default function definePriceRange(sequelize, DataTypes) {
  const PriceRange = sequelize.define('PriceRange', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'business_category',
        key: 'category_id'
      }
    },
    min_price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    max_price: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'price_range',
    timestamps: false
  });

  return PriceRange;
}

