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

  function makeDeleteAnnouncement() {
    var DeleteAnnouncementMethod = new HttpMethod.DeleteForm()
      .addPathComponent("api/messages")
      .addPathParameter("id")
      .build();

    return function(form) {
      return new DeleteAnnouncementMethod()
        .setId(form.id)
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

  function makeDeleteInvite() {
    var DeleteInviteMethod = new HttpMethod.DeleteForm()
      .addPathComponent("api/invites")
      .addPathParameter("id")
      .build();

    return function(form) {
      return new DeleteInviteMethod()
        .setId(form.id)
        .execute();
    }
  }

  function makeUpdateProfile() {
    var UpdateProfileMethod = new HttpMethod.PutForm()
      .addPathComponent("/api/profile")
      .addQueryParameter("assetId")
      .build();

    return function updateProfile(form) {
      return new UpdateProfileMethod()
        .setAssetId(form.assetId)
        .execute();
    }
  }

  function ApiService() {

    this.saveMethods = {
      "ann": {
        "cre": makePostAnnouncement(),
        "upd": makeUpdateAnnouncement(),
        "del": makeDeleteAnnouncement()
      },
      "con": makePostGreeting(),
      "inv": {
        "cre": makePostInvite(),
        "upd": makeUpdateInvite(),
        "del": makeDeleteInvite()
      },
      "usr": {
        "cre": makeUpdateProfile(),
        "upd": makeUpdateProfile()
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
    }
  }

  return ApiService;
});
