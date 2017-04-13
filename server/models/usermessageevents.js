'use strict';
module.exports = function(sequelize, DataTypes) {
  const extend = require("extend");

  var UserMessageEvents;
  var models;



  function schema() {
    return {
      clientTime: DataTypes.DATE,
      type: DataTypes.STRING,
    }
  }
  
   function includeMessage(associationName) {
    return {
      model: models.Message,
      as: associationName,
      attributes: [ "id", "fromUserId", "toUserId" ]
    }
  }
 
  function includeUser(associationName) {
    return {
      model: models.User,
      as: associationName,
      attributes: [ "id", "name" ]
    }
  }

  function associate(_models) {
    models = _models;
    UserMessageEvents.belongsTo(models.User, { as: "user" });
    UserMessageEvents.belongsTo(models.Message, { as: "message" });
  }

  function builder() {
    var values = {};
    var associations = {};
    return {
      seed: function(seed) {
        values.userId = seed.userId;
        if ("userId" in seed) {
          values.userId = seed.userId;
        }
        return this;
      },
      user: function(user) {
        values.userId = user.id;
        associations.user = user;
        return this;
      },
      type: function(type) {
        values.type = type;
        return this;
      },
      build: function() {
        return UserMessageEvents.create(values)
        .then(function(model) {
          extend(model, associations);
          return model;
        });
      }
    }
  }

  function includes(options) {
    var includes = [];
    if (options && options.deep) {
      includes.push(includeUser("user"));
      includes.push(includeMessage("message"));
    }
    return includes;
  }

  function findById(id, options) {
    return UserMessageEvents.find({
      where: { id: id },
      include: includes(options)
    });
  }

  function findAllWhere(where, options) {
    var query = {
      where: where,
      include: includes(options),
      order: [ [ "updatedAt"] ]
    };
    return UserMessageEvents.findAll(query);
  }

 function findReadMessageEventsForUser(userId, messageId, options) {
     return UserMessageEvents.findAll({
      where: { userId: userId, messageId: messageId },
      include: includes(options),
      order: [ [ "createdAt", "ASC" ] ]
    })
 }


  function findByReceiver(toUserId, options) {
    return findAllWhere({
      "userId": toUserId
    }, options);
  }


  function destroyWhere(where) {
    return UserMessageEvents.destroy({ where: where });
  }

  function destroyAll() {
    return destroyWhere({});
  }

  function destroyById(id) {
    return destroyWhere({ id: id });
  }

  UserMessageEvents = sequelize.define('UserMessageEvents', schema(), {
    classMethods: {
      associate: associate,
      builder: builder,
      destroyAll: destroyAll,
      destroyById: destroyById,
      findReadMessageEventsForUser: findReadMessageEventsForUser,
      findById: findById,
      findByReceiver: findByReceiver
    }
  });


  return UserMessageEvents;
};
