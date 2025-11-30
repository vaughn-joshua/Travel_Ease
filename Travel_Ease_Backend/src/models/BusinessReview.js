/**
 * BusinessReview Model
 */

export default function defineBusinessReview(sequelize, DataTypes) {
  const BusinessReview = sequelize.define('BusinessReview', {
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
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'business',
        key: 'business_id'
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
    tableName: 'business_review',
    timestamps: false
  });

  return BusinessReview;
}

