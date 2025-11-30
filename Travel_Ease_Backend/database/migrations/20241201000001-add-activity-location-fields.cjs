'use strict';

/**
 * Migration to add location fields to activity table
 * These fields allow activities to store location details for display
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add name field
    await queryInterface.addColumn('activity', 'name', {
      type: Sequelize.STRING(200),
      allowNull: true
    });

    // Add location field
    await queryInterface.addColumn('activity', 'location', {
      type: Sequelize.STRING(300),
      allowNull: true
    });

    // Add brgy field
    await queryInterface.addColumn('activity', 'brgy', {
      type: Sequelize.STRING(200),
      allowNull: true
    });

    // Add province field
    await queryInterface.addColumn('activity', 'province', {
      type: Sequelize.STRING(200),
      allowNull: true
    });

    // Add city field
    await queryInterface.addColumn('activity', 'city', {
      type: Sequelize.STRING(200),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns in reverse order
    await queryInterface.removeColumn('activity', 'city');
    await queryInterface.removeColumn('activity', 'province');
    await queryInterface.removeColumn('activity', 'brgy');
    await queryInterface.removeColumn('activity', 'location');
    await queryInterface.removeColumn('activity', 'name');
  }
};

