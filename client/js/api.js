// api.js - ApiService

define([ "http" ], function(HttpMethod) {

  function ApiService() {

    var schema = {
      announcements: {
        id: "announcementId",
        props: [ "assetId", "startDate", "endDate" ]
      },
      greetings: {
        id: "greetingId",
        props: [ "assetId", "toUserId" ]
      },
      invites: {
        id: "inviteId",
        props: [ "assetId", "toAddress" ]
      },
      reminders: {
        id: "reminderId",
        props: [ "assetId", "toUserId" ]
      }
    }

    for (var entityName in schema) {
      this[entityName] = (function(entityDesc) {
        function build(builderClass, entityId) {
          var builder = new builderClass();
          builder
            .addPathComponent(entityName);
          if (entityId) {
            builder.addPathParameter(entityId);
          }
          for (var i = 0; i < entityDesc.props.length; ++i) {
            builder.addQueryParameter(entityDesc.props[i]);
          }
          return builder.build();
        }
        return {
          post: build(HttpMethod.PostForm),
          put: build(HttpMethod.PutForm, entityDesc.id)
        }
      })(schema[entityName]);
    }
  }

  ApiService.prototype = {

    saveVideo: function(blob) {
      var self = this;
      if (!self.SaveVideoMethod) {
        self.SaveVideoMethod = new HttpMethod.PostBinary("video/webm")
          .addPathComponent("/assets")
          .build();
      }
      return new self.SaveVideoMethod()
        .setBody(blob)
        .execute();
    },

    postAnnouncement: function(params) {
      return new this.announcements.post()
        .setAssetId(params.assetId)
        .setStartDate(params.startDate)
        .setEndDate(params.endDate)
        .execute();
    },

    updateAnnouncement: function(params) {
      return new this.announcements.put()
        .setAnnouncementId(params.announcementId)
        .setAssetId(params.assetId)
        .execute();
    },

    postGreeting: function(params) {
      return new this.greetings.post()
        .setAssetId(params.assetId)
        .setToUserId(params.toUserId)
        .execute();
    },

    updateGreeting: function(params) {
      return new this.greetings.put()
        .setGreetingId(params.greetingId)
        .setAssetId(params.assetId)
        .setToUserId(params.toUserId)
        .execute();
    },

    postInvite: function(params) {
      return new this.invites.post()
        .setAssetId(params.assetId)
        .setToAddress(params.toAddress)
        .execute();
    },

    updateInvite: function(params) {
      return new this.invites.put()
        .setGreetingId(params.inviteId)
        .setAssetId(params.assetId)
        .setToAddress(params.toAddress)
        .execute();
    },

    updateUser: function(params) {
      var self = this;
      if (!self.UpdateUserMethod) {
        self.UpdateUserMethod = new HttpMethod.PutForm()
          .addPathComponent("/users/-")
          .addQueryParameter("assetId")
          .build();
      }
      return new self.UpdateUserMethod()
        .setAssetId(params.assetId)
        .execute();
    }
  }

  return ApiService;
});
