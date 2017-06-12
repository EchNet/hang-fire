'use strict';
module.exports = function(sequelize, DataTypes) {
  var EmailProfile;
  var models;

  function schema() {
    return {
      email: {
        type: DataTypes.STRING,
        unique: true
      }
    }
  }

  function associate(_models) {
    models = _models;
    EmailProfile.belongsTo(models.User, { "as": "user" });
  }

  function builder() {
    var values = {};
    return {
      user: function(user) {
        values.userId = user.id;
        return this;
      },
      email: function(email) {
        values.email = email;
        return this;
      },
      build: function() {
        return EmailProfile.create(values);
      },
      upsert: function() {
        return EmailProfile.upsert(values);
      }
    }
  }

  function query(where, options) {
    var include;
    if (options && options.deep) {
      include = [{
        model: models.User,
        as: "user",
        include: [{
          model: models.Asset,
          as: "asset"
        }]
      }];
    }
    return {
      where: where,
      include: include
    }
  }

  function findById(id, options) {
    return EmailProfile.findOne(query({ id: id }, options));
  }

  function findByEmail(email, options) {
    return EmailProfile.findOne(query({ email: email }, options));
  }

  function findByUserId(userId, options) {
    return EmailProfile.findAll(query({ userId: userId }, options));
  }

  function findByUser(user, options) {
    return findByUserId(user.id, options);
  }

  function destroyWhere(where) {
    return EmailProfile.destroy({ where: where });
  }

  function destroyAll(id) {
    return destroyWhere({});
  }

  function destroyById(id) {
    return destroyWhere({ id: id });
  }

  EmailProfile = sequelize.define("EmailProfile", schema(), {
    classMethods: {
      associate: associate,
      builder: builder,
      findById: findById,
      findByEmail: findByEmail,
      findByUser: findByUser,
      findByUserId: findByUserId,
      destroyAll: destroyAll,
      destroyById: destroyById
    }
  })

  return EmailProfile;
};
