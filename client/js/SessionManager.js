// session.js

define([ "jquery", "util/Cookie", "util/HttpMethod", "ui/observable", "ActionItem" ],
function($,        Cookie,        HttpMethod,        Observable,      ActionItem) {

  var DEFAULT_OPTIONS = {
    pollingPeriod: 3000
  };

  function salt() {
    return String(Math.floor(0xffffffff * Math.random()));
  }

  var POLL = new HttpMethod.Get()
    .addPathComponent("a")
    .addQueryParameter("_", "salt")
    .build();
  var REQUEST_EMAIL_VERIFICATION = new HttpMethod.Get()
    .addPathComponent("l")
    .addQueryParameter("_", "salt")
    .addQueryParameter("email")
    .build();
  var FACEBOOK_LOGIN = new HttpMethod.Post()
    .addPathComponent("f")
    .addQueryParameter("id")
    .addQueryParameter("email")
    .addQueryParameter("name")
    .addQueryParameter("picture")
    .build();
  var LOGOUT = new HttpMethod.Get()
    .addPathComponent("o")
    .addPathParameter("sid")
    .build();

  var COOKIE = new Cookie("s");

  function notifyStateChangeListeners(self) {
    self.state.notifyChangeListeners();
  }

  // private - Notify action listeners.
  function notifyActionListeners(self) {
    self.actionItems.notifyChangeListeners();
  }

  // private - Update state to reflect a valid response from server.
  function handleAResults(self, results) {
    self.responseCount += 1;
    self.localErrorCount = 0;
    self.waiting = false;

    if (results.user) {
      self.user = results.user;
    }

    self.user && self.user.name ? startPolling(self) : stopPolling(self);

    var actionItems = results.actionItems;
    if (actionItems) {
      // TODO: do differencing
      for (var i = 0; i < actionItems.length; ++i) {
        actionItems[i] = new ActionItem(actionItems[i]);
      }
      self.actionItems.value = actionItems;
      notifyActionListeners(self);
    }

    // Then trigger handlers that observe the model.
    notifyStateChangeListeners(self);
  }

  // private - Update state to reflect an error, either network or backend.
  function handleAError(self, error) {
    self.errorCount += 1;
    self.localErrorCount += 1;
    console.log(error);
    if (self.isUnresponsive()) {
      self.waiting = false;
    }
    notifyStateChangeListeners(self);
  }

  // private - Start the process of pulling the latest session info from the server.
  function startPolling(self) {
    if (!self.pollInterval) {
      function poll() {
        new POLL()
        .setSalt(salt())
        .execute()
        .then(function(results) {
          handleAResults(self, results);
        })
        .catch(function(error) {
          handleAError(self, error);
        });
        self.pollCount += 1;
      }
      poll();
      self.pollInterval = setInterval(poll, self.pollingPeriod);
    }
  }

  // private - Stop process.
  function stopPolling(self) {
    if (self.pollInterval) {
      clearInterval(self.pollInterval);
      self.pollInterval = 0;
    }
  }

  function init(self) {
    if (!self.responseCount) {
      self.waiting = true;
      startPolling(self);
      notifyStateChangeListeners(self);
    }
    return self;
  }

  function requestEmailTicket(self, email) {
    stopPolling(self);
    self.user = null;
    self.waiting = true;
    notifyStateChangeListeners(self);
    return new REQUEST_EMAIL_VERIFICATION()
      .setEmail(email)
      .setSalt(salt())
      .execute()
      .then(function(response) {
        handleAResults(self, response);
      })
      .catch(function(error) {
        handleAError(self, error);
      });
  }

  function logInWithFacebook(self, fbInfo) {
    stopPolling(self);
    self.user = null;
    self.waiting = true;
    notifyStateChangeListeners(self);
    return new FACEBOOK_LOGIN()
      .setId(fbInfo.id)
      .setName(fbInfo.name)
      .setEmail(fbInfo.email)
      .setPicture(fbInfo.picture)
      .execute()
      .then(function() {
        startPolling(self);
      })
      .catch(function(error) {
        handleAError(self, error);
      });
  }

  function logOut(self) {
    self.user = null;
    var sid = COOKIE.get();
    if (sid) {
      new LOGOUT().setSid(sid).execute();
      COOKIE.clear();
    }
    notifyStateChangeListeners(self);
  }

  function refreshNow(self) {
    stopPolling(self);
    startPolling(self);
  }

  function SessionManager(options) {
    var self = this;
    $.extend(self, DEFAULT_OPTIONS, options);

    self.pollCount = 0;
    self.responseCount = 0;
    self.errorCount = 0;
    self.localErrorCount = 0;

    // The session manager notifies listeners of general state changes.
    self.state = new Observable(self);

    // The session manager maintains the current list of action items, and notifies
    // listeners of changes.
    self.actionItems = new Observable([]);
  }

  SessionManager.prototype = {

    addStateChangeListener: function(listener) {
      return this.state.addChangeListener(listener);
    },

    addActionListener: function(listener) {
      return this.actionItems.addChangeListener(listener);
    },

    // Not yet logged in, or explicitly logged out.
    isLoginRequired: function() {
      return this.responseCount > 0 && !this.user;
    },

    // In application mode.
    isActive: function() {
      return COOKIE.get() && this.user;
    },

    // Unresponsive (regardless of mode).
    isUnresponsive: function() {
      return this.localErrorCount >= this.retryTolerance;
    },

    // Initiate startup processes.
    init: function() {
      return init(this);
    },

    requestEmailTicket: function(email) {
      return requestEmailTicket(this, email);
    },

    logInWithFacebook: function(fbInfo) {
      return logInWithFacebook(this, fbInfo);
    },

    refreshNow: function() {
      return refreshNow(this);
    },

    logOut: function() {
      return logOut(this);
    }
  }

  return SessionManager;
});
