/**
 * Blog Model (New UUID-based)
 */

export default function defineBlog(sequelize, DataTypes) {
  const Blog = sequelize.define('Blog', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    coverImageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'coverImageUrl'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'isFeatured'
    },
    readingMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'readingMinutes'
    },
    publishedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'publishedAt'
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updatedAt'
    }
  }, {
    tableName: 'Blog',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['category'], name: 'idx_blog_category' },
      { fields: ['isFeatured'], name: 'idx_blog_is_featured' },
      { fields: ['publishedAt'], name: 'idx_blog_published_at' },
      { fields: ['slug'], name: 'idx_blog_slug' }
    ]
  });

  return Blog;
}

