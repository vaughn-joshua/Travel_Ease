/**
 * BusinessCategory Model
 */

// Category enum values matching the database
export const CATEGORY_VALUES = [
  'food',
  'drinks',
  'accomodation',
  'souvenir shop',
  'nature',
  'night life',
  'leisure',
  'activities',
  'local offers'
];

export default function defineBusinessCategory(sequelize, DataTypes) {
  const BusinessCategory = sequelize.define('BusinessCategory', {
    category_id: {
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
    category_name: {
      type: DataTypes.ENUM(...CATEGORY_VALUES),
      allowNull: false
    }
  }, {
    tableName: 'business_category',
    timestamps: false
  });

  return BusinessCategory;
}

