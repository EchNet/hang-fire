// api.js - ApiService

define([ "util/HttpMethod" ], function(HttpMethod) {

  function makePostAnnouncement() {
    var PostAnnouncementMethod = new HttpMethod.PostForm()
      .addPathComponent("api/messages")
      .addQueryParameter("assetId")
      .addQueryParameter("startDate")
      .addQueryParameter("endDate")
      .addQueryParameter("type")
      .build();

    return function(form) {
      return new PostAnnouncementMethod()
        .setAssetId(form.assetId)
        .setStartDate(form.startDate)
        .setEndDate(form.endDate)
        .setType(form.type || 3)
        .execute();
    }
  }

  function makeUpdateAnnouncement() {
    var UpdateAnnouncementMethod = new HttpMethod.PutForm()
      .addPathComponent("api/messages")
      .addPathParameter("id")
      .addQueryParameter("assetId")
      .addQueryParameter("startDate")
      .addQueryParameter("endDate")
      .addQueryParameter("type")
      .build();

    return function(form) {
      return new UpdateAnnouncementMethod()
        .setId(form.id)
        .setAssetId(form.assetId)
        .setStartDate(form.startDate)
        .setEndDate(form.endDate)
        .setType(form.type)
        .execute();
    }
  }

  function makePostGreeting() {
    var PostGreetingMethod = new HttpMethod.PostForm()
      .addPathComponent("api/messages")
      .addQueryParameter("assetId")
      .addQueryParameter("toUserId")
      .build();

    return function(form) {
      return new PostGreetingMethod()
        .setAssetId(form.assetId)
        .setToUserId(form.toUserId)
        .execute();
    }
  }

  function makeUpdateGreeting() {
    var UpdateGreetingMethod = new HttpMethod.PutForm()
      .addPathComponent("api/messages")
      .addPathParameter("id")
      .addQueryParameter("assetId")
      .build();

    return function(form) {
      return new UpdateGreetingMethod()
        .setAssetId(form.assetId)
        .execute();
    }
  }

  function makePostInvite() {
    var PostInviteMethod = new HttpMethod.PostForm()
      .addPathComponent("api/invites")
      .addQueryParameter("assetId")
      .addQueryParameter("email")
      .addQueryParameter("name")
      .build();

    return function(form) {
      return new PostInviteMethod()
        .setAssetId(form.assetId)
        .setEmail(form.email)
        .setName(form.name)
        .execute();
    }
  }

  function makeUpdateInvite() {
    var UpdateInviteMethod = new HttpMethod.PutForm()
      .addPathComponent("api/invites")
      .addPathParameter("id")
      .addQueryParameter("assetId")
      .build();

    return function(form) {
      return new UpdateInviteMethod()
        .setId(form.id)
        .setAssetId(form.assetId)
        .execute();
    }
  }

  function makePostReminder() {
    var PostReminderMethod = new HttpMethod.PostForm()
      .addPathComponent("api/reminders")
      .addQueryParameter("toUserId")
      .addQueryParameter("assetId")
      .addQueryParameter("deliverAt")
      .addQueryParameter("repeat")
      .build();

    return function(form) {
      return new PostReminderMethod()
        .setToUserId(form.toUserId)
        .setAssetId(form.assetId)
        .setDeliverAt(form.deliverAt)
        .setRepeat(form.repeat)
        .execute();
    }
  }

  function makeDeleteMethod(what) {
    var DeleteMethod = new HttpMethod.DeleteForm()
      .addPathComponent("api")
      .addPathComponent(what)
      .addPathParameter("id")
      .build();

    return function(form) {
      return new DeleteMethod().setId(form.id).execute();
    }
  }

  function ApiService() {

    this.saveMethods = {
      "ann": {
        "cre": makePostAnnouncement(),
        "upd": makeUpdateAnnouncement(),
        "del": makeDeleteMethod("messages")
      },
      "con": makePostGreeting(),
      "inv": {
        "cre": makePostInvite(),
        "upd": makeUpdateInvite(),
        "del": makeDeleteMethod("invites")
      },
      "rem": {
        "cre": makePostReminder(),
        "del": makeDeleteMethod("reminders")
      }
    }
  }
  
  var ActOnInviteMethod = new HttpMethod.PostForm()
    .addPathComponent("api/invites")
    .addPathParameter("id")
    .addPathParameter("act")
    .build();

  var UpdateUserMethod = new HttpMethod.PutForm()
    .addPathComponent("api/users")
    .addPathParameter("id")
    .addQueryParameter("name")
    .build();

  var UpdateProfileMethod = new HttpMethod.PutForm()
    .addPathComponent("/api/profile")
    .addQueryParameter("assetId")
    .build();

  var LogEventMethod = new HttpMethod.PostForm()
    .addPathComponent("/api/events")
    .addQueryParameter("type")
    .addQueryParameter("messageId")
    .addQueryParameter("clientTime")
    .build();

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

    saveForm: function(what, action, form) {
      var spec = this.saveMethods[what];
      return typeof spec == "function" ? spec(form) : spec[action](form);
    },

    acceptInvite: function(id) {
      return new ActOnInviteMethod().setId(id).setAct("accept").execute();
    },

    rejectInvite: function(id) {
      return new ActOnInviteMethod().setId(id).setAct("reject").execute();
    },

    resendInvite: function(id) {
      return new ActOnInviteMethod().setId(id).setAct("resend").execute();
    },

    updateUser: function(id, name) {
      return new UpdateUserMethod().setId(id).setName(name).execute();
    },

    updateProfile: function(assetId) {
      return new UpdateProfileMethod().setAssetId(assetId).execute();
    },

    logEvent: function(props) {
      return new LogEventMethod()
        .setMessageId(props.messageId)
        .setType(props.type)
        .setClientTime(new Date().toISOString())
        .execute();
    }
  }

  return ApiService;
});
