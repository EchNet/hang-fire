// Login.js - Login component.

define([ "jquery", "ui/index", "fbbutton",     "waitanim", "services" ],
function($,        ui,         FacebookButton, WaitAnim,   Services) {

  var EmailForm = ui.Component.defineClass(function(c) {

    function submit(self, text) {
      self.sendButton.enabled = false;
      self.emailInput.enabled = false;
      self.fbButton.enabled = false;
      Services.sessionManager.requestEmailTicket(text)
      .then(function() {
        self.invokePlugin("openEmailSent");
      })
      .catch(function(e) {
        self.messageBox.text = "Can't reach the server. Please try again.";
        self.sendButton.enabled = true;
        self.emailInput.enabled = true;
        self.fbButton.enabled = true;
      })
    }

    c.defineInitializer(function() {
      var self = this;

      self.emailInput = new ui.EmailInput().addPlugin({
        submit: function(text) {
          submit(self, text);
        },
        showInvalid: function() {
          self.messageBox.text = "That doesn't look like an email address.  Please retype it and try again.";
        },
        onChange: function() {
          if (self.emailInput.valid && self.emailInput.enabled) {
            self.messageBox.text = "";
          }
        }
      });

      self.fbButton = ui.Button.create("Log in through Facebook", function() {
        self.invokePlugin("openFacebookForm");
      });

      self.sendButton = ui.Button.create("Send request", function() {
        self.emailInput.submit();
      }).addClass("sendEmail");

      self.messageBox = ui.div();

      self
        .append(ui.div().addClass("big").addClass("title")
          .setText("Log in to Living Connections"))
        .append(ui.div().addClass("chunk")
           .setText("Login to Living Connections is by invitation only.  " +
              "Ask a Living Connections user for an invitation."))
        .append(ui.div().addClass("chunk")
          .setText("Or you may request an invitation by email below."))
        .append(ui.div().addClass("chunk").addClass("indent")
          .append(ui.div().addClass("prompt").setText("YOUR EMAIL ADDRESS"))
          .append(ui.div().append(self.emailInput))
          .append(ui.div().append(self.sendButton))
        );
    });

    c.extendPrototype({
      open: function() {
        var self = this;
        self.messageBox.text = "";
        setTimeout(function() {
          self.emailInput.focus();
        }, 100);
      }
    });
  });

  var EmailSent = ui.Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self
        .append(ui.div().addClass("big").addClass("title")
          .setText("Log in to Living Connections"))
        .append(ui.div().addClass("chunk")
          .setText("We have just sent a link, usable any time within the next 24 hours, to your email address. Go to your email and click the link to log in to Living Connections."))
        .append(ui.div().addClass("chunk")
          .setText("You may close this window."))
    });
  });

  var FacebookLogin = ui.Component.defineClass(function(c) {
  });

  var FacebookInfo = ui.Component.defineClass(function(c) {

    var fbService = Services.facebookService;

    c.defineInitializer(function() {
      var self = this;
      var userImage = new ui.Image();
      var nameLabel = new ui.Component("<span>");
      var emailLabel = new ui.Component("<span>");
      var loginButton = ui.Button.create("That's correct - log in", function() {
        loginButton.enabled = false;
        Services.sessionManager.logInWithFacebook(fbService.value);
      });
      var fbButton = new FacebookButton("<span>");

      self.ele
        .addClass("fbInfo")
        .append($("<div>").addClass("block").text("You are:"))
        .append($("<div>").addClass("block")
          .append(userImage.ele)
          .append($("<div>").addClass("right")
            .append($("<div>").append(nameLabel.ele))
            .append($("<div>").append(emailLabel.ele))
            .append($("<div>").append(loginButton.ele))
          ))
        .append($("<div>").addClass("block")
          .append($("<span>").text("or... "))
          .append(fbButton.ele))

      function updateState(fbInfo) {
        userImage.src = fbInfo.picture || "";
        nameLabel.text = fbInfo.name || "";
        emailLabel.text = fbInfo.email || "";
        loginButton.enabled = fbInfo.status == fbService.CONNECTED;
      }

      updateState(fbService.value);
      fbService.addChangeListener(updateState);
    });
  });

  var FacebookForm = ui.Carton.defineClass(function(c) {

    var fbService = Services.facebookService;

    var WAITING = fbService.WAITING;
    var INFO = "info";
    var FBLOGIN = "fblogin";
    var UNKNOWN = fbService.UNKNOWN;
    var TIMEOUT = fbService.TIMEOUT;

    c.defineDefaultOptions({
      initialState: WAITING
    });

    c.defineInitializer(function() {
      var self = this;
      self.ele
        .addClass("fbForm")
        .append($("<div>").addClass("header").text("Log in through Facebook"));
      self
        .addCompartment(WAITING, new WaitAnim($("<div>"), { ndots: 8 }))
        .addCompartment(INFO, new FacebookInfo())
        .addCompartment(UNKNOWN, new FacebookLogin())
        .addCompartment(TIMEOUT, new ui.Component({ cssClasses: [ "message", "chunk" ] })
          .setText("Sorry, we can't connect to Facebook now"))
        .addState(fbService.CONNECTED, [ INFO, FBLOGIN ]);
      self.ele
        .append($("<div>")
          .addClass("block")
          .append(ui.Button.create("Go Back", function() {
            self.invokePlugin("openEmailForm");
          }).ele));

      function updateState(fbInfo) {
        self.show(fbInfo.status || fbService.WAITING);
      }

      updateState(fbService.value);
      fbService.addChangeListener(updateState);
    });

    c.extendPrototype({
      open: function() {
        fbService.open();
        return ui.Carton.prototype.open.call(this);
      }
    });
  });

  return ui.Component.defineClass(function(c) {

    var EMAIL = "email";
    var EMAIL_SENT = "emailSent";
    var FB = "facebook";

    c.defineInitializer(function() {
      var self = this;
      var carton = new ui.Carton({
        cssClass: "body",
        initialState: EMAIL
      }).addCompartment(EMAIL, new EmailForm().addPlugin(self))
        .addCompartment(EMAIL_SENT, new EmailSent().addPlugin(self))
        .addCompartment(FB, new FacebookForm().addPlugin(self));
      self.ele
        .append($("<div>").addClass("header"))
        .append(carton.ele);
      self.carton = carton;
    });

    c.extendPrototype({
      open: function() {
        this.carton.open();
      },
      close: function() {
        this.carton.close();
      },
      openFacebookForm: function() {
        return this.carton.show(FB);
      },
      openEmailForm: function() {
        return this.carton.show(EMAIL);
      },
      openEmailSent: function() {
        return this.carton.show(EMAIL_SENT);
      }
    });
  });
});
