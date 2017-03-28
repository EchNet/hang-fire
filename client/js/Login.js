// Login.js - Login component.

define([ "jquery", "ui/index", "fbbutton",     "waitanim", "services" ],
function($,        ui,         FacebookButton, WaitAnim,   Services) {

  var EmailForm = ui.Component.defineClass(function(c) {

    function submit(self, text) {
      Services.sessionManager.requestEmailTicket(text)
      .then(function() {
        self.messageBox.text = "Login link sent to your email box.  You may close this window.";
        self.sendButton.enabled = false;
        self.emailInput.enabled = false;
        self.fbButton.enabled = false;
      })
      .catch(function(e) {
        self.messageBox.text = "Can't reach the server. Please try again.";
      })
    }

    c.defineInitializer(function() {
      var self = this;

      var emailInput = new ui.EmailInput().addPlugin({
        submit: function(text) {
          submit(self, text);
        },
        showInvalid: function() {
          self.messageBox.text = "That doesn't look like an email address.  Please retype it and try again.";
        }
      });
      emailInput.addChangeListener(function() {
        if (emailInput.valid && emailInput.enabled) {
          self.messageBox.text = "";
        }
      });

      var fbButton = ui.Button.create("Log in through Facebook", function() {
        self.invokePlugin("openFacebookForm");
      });

      var sendButton = ui.Button.create("Send request", function() {
        emailInput.submit();
      });

      var messageBox = new ui.Component();

      self.ele
        .append($("<div>").addClass("big").addClass("chunk")
          .text("Log in to Living Connections"))
        .append($("<div>").addClass("chunk")
          .append(fbButton.ele.addClass("useFb")))
        .append($("<div>").addClass("big").addClass("chunk")
          .text("OR"))
        .append($("<div>").addClass("form")
          .append($("<div>").text("Use your email address to log in:"))
          .append($("<div>").addClass("indent")
            .append($("<div>").addClass("prompt")
              .text("EMAIL ADDRESS"))
            .append($("<div>")
              .append(emailInput.ele))
            .append($("<div>")
              .append(sendButton.ele.addClass("sendEmail")))
          )
        )
        .append(messageBox.ele.addClass("chunk").addClass("message"));

      self.messageBox = messageBox;
      self.emailInput = emailInput;
      self.sendButton = sendButton;
      self.fbButton = fbButton;
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
    var FB = "facebook";

    c.defineInitializer(function() {
      var self = this;
      var carton = new ui.Carton({
        cssClass: "body",
        initialState: EMAIL
      }).addCompartment(EMAIL, new EmailForm().addPlugin(self))
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
      }
    });
  });
});
