'use strict';

const Promise = require("promise");

module.exports = {
  up: function (queryInterface, Sequelize) {

    const promises = []

    promises.push(queryInterface.insert(null, "StorageSystems", {
      id: 0,
      type: "file",
      name: "Local File System",
      createdAt: new Date(),
      updatedAt: new Date()
    }, {}));
    
    promises.push(queryInterface.insert(null, "StorageSystems", {
      id: 1,
      type: "cloudinary",
      name: "Cloudinary - Dev/Test",
      createdAt: new Date(),
      updatedAt: new Date()
    }, {}));

    return Promise.all(promises);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete("StorageSystems", null, {});
  }
};
