/**
 * Business Model
 */

export default function defineBusiness(sequelize, DataTypes) {
  const Business = sequelize.define('Business', {
    business_id: {
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    house_number: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    street: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    brgy: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    longtitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true
    },
    google_authenticator: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    picture: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'business',
    timestamps: false
  });

  return Business;
}

