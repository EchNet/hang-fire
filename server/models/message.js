'use strict';
module.exports = function(sequelize, DataTypes) {
  const extend = require("extend");

  var Message;
  var models;

  const GREETING_TYPE = 0;
  const INVITE_TYPE = 1;
  const PROFILE_TYPE = 2;
  const ANNOUNCEMENT_TO_ALL_TYPE = 3;
  const ANNOUNCEMENT_TO_NEW_TYPE = 4;
  const REMINDER_TYPE = 5;
  const MAX_TYPE = 5;

  function schema() {
    return {
      endDate: DataTypes.DATE,
      startDate: DataTypes.DATE,
      type: DataTypes.INTEGER,
      status: DataTypes.INTEGER
    }
  }

  function includeAsset() {
    return {
      model: models.Asset,
      as: "asset",
      attributes: [ "url" ]
    }
  }

  function includeUser(associationName) {
    return {
      model: models.User,
      as: associationName,
      attributes: [ "id", "name" ],
      include: [ includeAsset() ]
    }
  }

  function associate(_models) {
    models = _models;
    Message.belongsTo(models.User, { as: "toUser" });
    Message.belongsTo(models.User, { as: "fromUser" });
    Message.belongsTo(models.Asset, { as: "asset" });
  }

  function builder() {
    var values = {};
    var associations = {};
    return {
      seed: function(seed) {
        values.fromUserId = seed.fromUserId;
        values.assetId = seed.assetId;
        if ("toUserId" in seed) {
          values.toUserId = seed.toUserId;
        }
        return this;
      },
      assetId: function(assetId) {
        values.assetId = assetId;
        return this;
      },
      fromUser: function(fromUser) {
        values.fromUserId = fromUser.id;
        associations.fromUser = fromUser;
        return this;
      },
      toUser: function(toUser) {
        values.toUserId = toUser.id;
        associations.toUser = toUser;
        return this;
      },
      type: function(type) {
        values.type = type;
        return this;
      },
      build: function() {
        return Message.create(values)
        .then(function(model) {
          extend(model, associations);
          return model;
        });
      }
    }
  }

  function includes(options) {
    var includes = [ includeAsset() ];
    if (options && options.deep) {
      includes.push(includeUser("toUser"));
      includes.push(includeUser("fromUser"));
    }
    return includes;
  }

  function findById(id, options) {
    return Message.find({
      where: { id: id },
      include: includes(options)
    });
  }

  function findAllWhere(where, options) {
    var query = {
      where: where,
      include: includes(options),
      order: [ [ "updatedAt", "DESC" ] ]
    };
    if (options && options.current) {
      var date = new Date();
      query.where.startDate = { "$lte": date };
      query.where.endDate = { "$gt": date };
    }
    if (options && options.before) {
      query.where.updatedAt = { "$lt": options.before };
    }
    if (options && options.limit) {
      query.limit = options.limit;
    }
    return Message.findAll(query);
  }

  function findAnnouncements() {
    return findAllWhere({
      "toUserId": null,
      "$or": [{
        "type": ANNOUNCEMENT_TO_ALL_TYPE
      }, {
        "type": ANNOUNCEMENT_TO_NEW_TYPE
      }],
    }, {
      deep: 1,
      current: 1
    });
  }

  function findCurrentAnnouncementsForUser(userId) {
    return findAllWhere({
      "$or": [{
        "type": ANNOUNCEMENT_TO_ALL_TYPE
      }, {
        "type": ANNOUNCEMENT_TO_NEW_TYPE,
        "toUserId": null
      }],
    }, {
      deep: 1
    });
  }

 function findCurrentRemindersforUser(toUserId) {
     return Message.findAll({
      where: { toUserId: toUserId, type: REMINDER_TYPE },
      include: [{
        model: models.User,
        as: "fromUser",
        required: true
      }],
      include: [{
        model: models.User,
        as: "toUser",
        required: true
      },
      {
        model: models.Asset,
        as: "asset"
      }],
      order: [ [ "createdAt", "ASC" ] ]
    })
 }

 function findCurrentRemindersforSender (fromUserId) {
     return Message.findAll({
      where: { fromUserId: fromUserId , type: REMINDER_TYPE },
      include: [{
        model: models.User,
        as: "fromUser",
        required: true
      }],
      include: [{
        model: models.User,
        as: "toUser",
        required: true
      },
      {
        model: models.Asset,
        as: "asset"
      }],
      order: [ [ "createdAt", "ASC" ] ]
    })
 }

  function findByReceiver(toUserId, options) {
    return findAllWhere({
      "toUserId": toUserId
    }, options);
  }

  function findThread(u1, u2, options) {
    return findAllWhere({
      "type": { "$in": [ GREETING_TYPE, INVITE_TYPE ] },
      "$or": [{
        "fromUserId": u1,
        "toUserId": u2
      }, {
        "toUserId": u1,
        "fromUserId": u2
      }],
    }, options);
  }

  function destroyWhere(where) {
    return Message.destroy({ where: where });
  }

  function destroyAll() {
    return destroyWhere({});
  }

  function destroyById(id) {
    return destroyWhere({ id: id });
  }

  Message = sequelize.define('Message', schema(), {
    classMethods: {
      associate: associate,
      builder: builder,
      destroyAll: destroyAll,
      destroyById: destroyById,
      findAnnouncements: findAnnouncements,
      findCurrentAnnouncementsForUser: findCurrentAnnouncementsForUser,
      findCurrentRemindersforUser: findCurrentRemindersforUser,
      findCurrentRemindersforSender: findCurrentRemindersforSender,
      findById: findById,
      findByReceiver: findByReceiver,
      findThread: findThread
    }
  });

  Message.GREETING_TYPE = GREETING_TYPE;
  Message.INVITE_TYPE = INVITE_TYPE;
  Message.PROFILE_TYPE = PROFILE_TYPE;
  Message.ANNOUNCEMENT_TO_ALL_TYPE = ANNOUNCEMENT_TO_ALL_TYPE;
  Message.ANNOUNCEMENT_TO_NEW_TYPE = ANNOUNCEMENT_TO_NEW_TYPE;
  Message.REMINDER_TYPE = REMINDER_TYPE;
  Message.MAX_TYPE = MAX_TYPE;

  return Message;
};
