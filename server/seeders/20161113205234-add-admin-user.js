'use strict';

const Promise = require("promise");

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.insert(null, "Users", {
      id: 0,
      name: "Admin",
      level: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {}).then(function() {
      return queryInterface.insert(null, "EmailProfiles", {
        email: "admin@example.com",
        UserId: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }, {});
    });
  },

  down: function (queryInterface, Sequelize) {
    //return queryInterface.bulkDelete("Users", null, {});
    //return queryInterface.bulkDelete("EmailProfiles", null, {});
  }
};
