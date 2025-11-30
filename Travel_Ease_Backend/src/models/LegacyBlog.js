/**
 * Legacy Blog Model (lowercase, integer-based - deprecated)
 */

export default function defineLegacyBlog(sequelize, DataTypes) {
  const LegacyBlog = sequelize.define('LegacyBlog', {
    blog_id: {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    blog_date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'blog',
    timestamps: false
  });

  return LegacyBlog;
}

