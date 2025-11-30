'use strict';

/**
 * Initial database schema migration
 * Creates all tables with proper constraints and relationships
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create enums first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE category AS ENUM (
          'food', 'drinks', 'accomodation', 'souvenir shop',
          'nature', 'night life', 'leisure', 'activities', 'local offers'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE participant_role AS ENUM ('Admin', 'Editor', 'Viewer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE range AS ENUM (
          '0-100', '100-200', '200-400', '400-700',
          '700-1000', '1000-1500', '1500+'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE status_enum AS ENUM ('Draft', 'Active', 'Completed', 'Cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user table
    await queryInterface.createTable('user', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      auth_id: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      contact_no: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      auth_provider: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      profile_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create Blog table (UUID-based, new schema)
    await queryInterface.createTable('Blog', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      excerpt: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      coverImageUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readingMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      publishedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      author: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create blog table (legacy, integer-based)
    await queryInterface.createTable('blog', {
      blog_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      blog_date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      }
    });

    // Create business table
    await queryInterface.createTable('business', {
      business_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      house_number: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      street: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      brgy: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      longtitude: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true
      },
      google_authenticator: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      picture: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });

    // Create business_category table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS business_category (
        category_id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business(business_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        category_name category NOT NULL
      );
    `);

    // Create business_favorite table
    await queryInterface.createTable('business_favorite', {
      favorite_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'business',
          key: 'business_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      }
    });

    // Add unique constraint on business_favorite
    await queryInterface.addConstraint('business_favorite', {
      fields: ['user_id', 'business_id'],
      type: 'unique',
      name: 'business_favorite_user_id_business_id_key'
    });

    // Create business_hours table
    await queryInterface.createTable('business_hours', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'business',
          key: 'business_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      day_of_week: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      open_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      close_time: {
        type: Sequelize.TIME,
        allowNull: true
      }
    });

    // Create price_range table
    await queryInterface.createTable('price_range', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'business_category',
          key: 'category_id'
        },
        onUpdate: 'NO ACTION'
      },
      min_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });

    // Create menu_item table
    await queryInterface.createTable('menu_item', {
      menu_item_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'business',
          key: 'business_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create travel_plan table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS travel_plan (
        travel_plan_id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        start_date DATE,
        end_date DATE,
        description TEXT,
        visibility BOOLEAN DEFAULT false,
        visibility_end_date DATE,
        status status_enum DEFAULT 'Draft',
        max_slots INTEGER,
        location VARCHAR,
        visibility_timestamp TIMESTAMP(6)
      );
    `);

    // Create activity table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS activity (
        activity_id SERIAL PRIMARY KEY,
        travel_plan_id INTEGER REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        business_id INTEGER REFERENCES business(business_id) ON UPDATE NO ACTION,
        notes TEXT,
        target_date DATE,
        budget_range range,
        user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        is_priority BOOLEAN DEFAULT false,
        lat FLOAT,
        lng FLOAT
      );
    `);

    // Create participant table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS participant (
        participant_id SERIAL PRIMARY KEY,
        travel_plan_id INTEGER REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE ON UPDATE NO ACTION,
        role participant_role DEFAULT 'Viewer',
        joined_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
        status BOOLEAN DEFAULT false,
        UNIQUE(user_id, travel_plan_id)
      );
    `);

    // Create travel_plan_favorite table
    await queryInterface.createTable('travel_plan_favorite', {
      favorite_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      travel_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'travel_plan',
          key: 'travel_plan_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      }
    });

    // Add unique constraint on travel_plan_favorite
    await queryInterface.addConstraint('travel_plan_favorite', {
      fields: ['user_id', 'travel_plan_id'],
      type: 'unique',
      name: 'travel_plan_favorite_user_id_travel_plan_id_key'
    });

    // Create business_review table
    await queryInterface.createTable('business_review', {
      review_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      business_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'business',
          key: 'business_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      rating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      review_date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      }
    });

    // Create travel_plan_review table
    await queryInterface.createTable('travel_plan_review', {
      review_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      travel_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'travel_plan',
          key: 'travel_plan_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION'
      },
      rating: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      review_date: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      }
    });

    // Create indexes for Blog table
    await queryInterface.addIndex('Blog', ['category'], { name: 'idx_blog_category' });
    await queryInterface.addIndex('Blog', ['isFeatured'], { name: 'idx_blog_is_featured' });
    await queryInterface.addIndex('Blog', ['publishedAt'], { name: 'idx_blog_published_at' });
    await queryInterface.addIndex('Blog', ['slug'], { name: 'idx_blog_slug' });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of dependencies
    await queryInterface.dropTable('travel_plan_review');
    await queryInterface.dropTable('business_review');
    await queryInterface.dropTable('travel_plan_favorite');
    await queryInterface.dropTable('participant');
    await queryInterface.dropTable('activity');
    await queryInterface.dropTable('travel_plan');
    await queryInterface.dropTable('menu_item');
    await queryInterface.dropTable('price_range');
    await queryInterface.dropTable('business_hours');
    await queryInterface.dropTable('business_favorite');
    await queryInterface.dropTable('business_category');
    await queryInterface.dropTable('business');
    await queryInterface.dropTable('blog');
    await queryInterface.dropTable('Blog');
    await queryInterface.dropTable('user');

    // Drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS status_enum;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS range;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS participant_role;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS category;');
  }
};

