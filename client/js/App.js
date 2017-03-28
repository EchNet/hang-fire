// appui.js

define([ "jquery", "services", "Login", "Listing", "ActivityStarter", "waitanim", "ui/index" ],
function($,        Services,   Login,   Listing,   ActivityStarter,   WaitAnim,   ui) {

  var NO_VID =
    "Sorry, this browser is not capable of sending and receiving Living Connections videograms.";

  var CANT_CONNECT =
    "We're not able to connect to Living Connections' server at this time.  " +
    "We'll keep trying. In the meantime, please check your internet connection."

  var sessionManager = Services.sessionManager;

  // The main app header.
  var MainHeader = ui.Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;

      var titleLabel = new ui.Component({ html: "<span>", cssClass: "title" }).setText("LIVING CONNECTIONS");
      var userNameLabel = new ui.Component({ html: "<span>", cssClass: "userName" });
      var emailLabel = new ui.Component({ html: "<span>", cssClass: "hilite" });
      //var logoutLink = new ui.Component({ html: "<a>", cssClass: "logout" }).setText("Log out").addPlugin({
        //onClick: function() {
          //sessionManager.logOut();
        //}
      //});

      self.ele
        .addClass("header")
        .append(titleLabel.ele)
        .append($("<span>")
          .addClass("userIdent")
          .append(userNameLabel.ele)
          .append($("<span>").text(" "))
          .append(emailLabel.ele)
          .append($("<span>").text(" "))
          .append(logoutLink.ele));

      function update() {
        var user = sessionManager.user || {}
        userNameLabel.setText(user.name || "");
        emailLabel.setText(user.email && user.email != user.name ? user.email : "");
        logoutLink.setEnabled(!!sessionManager.user);
      }

      sessionManager.addStateChangeListener(update);
      sessionManager.addActionListener(update);
    });
  });

  var MainView = ui.Component.defineClass(function(c) {

    function Main_appendComponent(self, component) {
      self.ele.find("> .body").append(component.ele);
    }

    function Main_closeCurrentActivity(self) {
      var currentActivity = self.activity;
      self.activity = null;
      if (currentActivity) {
        currentActivity.close();
        self.fadeGoal.addGoal(currentActivity, 0).then(function() {
          currentActivity.ele.remove();
        });
      }
    }

    function Main_showListing(self) {
      Main_closeCurrentActivity(self);
      var listing = self.listing;
      if (!listing) {
        self.listing = listing = new Listing().addPlugin({
          openActionItem: function(actionItem) {
            Main_openActionItem(self, actionItem);
          }
        });
        Main_appendComponent(self, listing);
      }
      self.fadeGoal.addGoal(listing, 1).then(function() {
        listing.open();
      });
      return self;
    }

    function Main_newActivity(self, actionItem) {
      return ActivityStarter.startActivityFor(actionItem).addPlugin({
        openOther: function(actionItem) {
          Main_openActionItem(self, actionItem);
        },
        exit: function() {
          Main_showListing(self);
        }
      });
    }

    function Main_openActionItem(self, actionItem) {
      var activity = Main_newActivity(self, actionItem);
      Main_appendComponent(self, activity);
      if (self.listing) {
        self.fadeGoal.addGoal(self.listing, 0);
      }
      Main_closeCurrentActivity(self);
      self.fadeGoal.addGoal(activity, 1).then(function() {
        self.activity = activity;
        activity.open();
      });
      return self;
    }

    c.defineInitializer(function() {
      var self = this;

      self.ele
        .append(new MainHeader().ele)
        .append($("<div>").addClass("body"));

      self.fadeGoal = new ui.FadeGoal();
    });

    c.extendPrototype({
      open: function() {
        var self = this;
        return Main_showListing(self);
      },

      close: function() {
        var self = this;
        self.currentBody && self.currentBody.close();
        return self;
      }
    });
  });

  return function() {

    var STARTUP_VIEW = "startup";
    var LOGIN_VIEW = "login";
    var MAIN_VIEW = "main";

    var carton = new ui.Carton({
      selector: "#content",
      noAppend: true,
      goalType: ui.FadeGoal,
      initialState: STARTUP_VIEW
    })

    carton.addCompartment(STARTUP_VIEW, new ui.Component("#startup"));
    carton.addCompartment(LOGIN_VIEW, new Login("#login"));
    carton.addCompartment(MAIN_VIEW, new MainView("#app"));

    var under = $("#startup .under");
    var waitAnim = new WaitAnim({ ndots: 10 });
    under.after(waitAnim.ele);

    function show(state, msg) {
      carton.show(state);
      under.text(msg || "");
    }

    function handleSessionStateChange(sessionManager) {
      if (sessionManager.isUnresponsive()) {
        show(STARTUP_VIEW, CANT_CONNECT);
      }
      else if (sessionManager.isLoginRequired()) {
        show(LOGIN_VIEW);
      }
      else if (sessionManager.isActive()) {
        show(MAIN_VIEW);
      }
      if (sessionManager.waiting) {
        waitAnim.start();
      }
      else {
        waitAnim.stop();
      }
    }

    function startSession() {
      sessionManager.addStateChangeListener(handleSessionStateChange);
      sessionManager.init();
    }

    this.open = function() {
      carton.open();
      if (Services.videoService.isCapable()) {
        startSession();
      }
      else {
        show(STARTUP_VIEW, NO_VID);
      }
    }
  }
});
