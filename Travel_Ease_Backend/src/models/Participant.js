/**
 * Participant Model
 */

// Participant role enum values
export const ROLE_VALUES = ['Admin', 'Editor', 'Viewer'];

export default function defineParticipant(sequelize, DataTypes) {
  const Participant = sequelize.define('Participant', {
    participant_id: {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    role: {
      type: DataTypes.ENUM(...ROLE_VALUES),
      defaultValue: 'Viewer'
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'participant',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'travel_plan_id'],
        name: 'participant_user_id_travel_plan_id_key'
      }
    ]
  });

  return Participant;
}

