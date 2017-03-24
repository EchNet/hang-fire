// fblogin.js - Facebook Login component

define([ "jquery", "services", "ui/index", "fbbutton" ],
function($,        Services,   ui,         FacebookButton) {

  var fbService = Services.facebookService;

  var WAITING = fbService.WAITING;
  var CONNECTED = fbService.CONNECTED;
  var UNKNOWN = fbService.UNKNOWN;
  var TIMEOUT = fbService.TIMEOUT;

  var FacebookInfo = ui.Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      var userImage = new ui.Image();
      var nameLabel = new ui.Component("<span>");
      var emailLabel = new ui.Component("<span>");
      var loginButton = ui.Button.create("That's me!", function() {
        loginButton.enabled = false;
        Services.sessionManager.logInWithFacebook(fbService.value)
        .then(function(response) {
          console.log(response);
        })
        .catch(function(err) {
          console.log(err);
          self.requestClose();
        })
      });
      var connectedElements = new ui.Component($("<div>")
      .append($("<div>").addClass("block").text("You are:"))
      .append($("<div>").addClass("block")
        .append(userImage.ele)
        .append($("<div>").addClass("right")
          .append($("<div>").append(nameLabel.ele))
          .append($("<div>").append(emailLabel.ele))
          .append($("<div>").append(loginButton.ele))
      )));
      var fbButton = new FacebookButton($("<span>"));

      self.ele
        .append(connectedElements.ele)
        .append($("<div>").addClass("block").append(fbButton.ele))

      function updateState(fbInfo) {
        userImage.src = fbInfo.picture || "";
        nameLabel.text = fbInfo.name || "";
        emailLabel.text = fbInfo.email || "";
        connectedElements.visible = fbInfo.status == CONNECTED;
        loginButton.enabled = fbInfo.id != null;
      }

      updateState(fbService.value);
      fbService.addChangeListener(updateState);
    });

    c.extendPrototype({
      requestClose: function() {
        this.invokePlugin("requestClose");
      }
    });
  });

  return ui.Carton.defineClass(function(c) {

    c.defineDefaultOptions({
      initialState: WAITING
    });

    c.defineInitializer(function() {
      var self = this;
      var fbInfo = new FacebookInfo();

      self.ele.addClass("fbForm")
      self
        .addCompartment(CONNECTED, fbInfo)
        .addCompartment(WAITING, new ui.Component($("<div>")
          .append(new FacebookButton(undefined, { size: "xlarge" }).ele)))
        .addState(UNKNOWN, [ WAITING ])
        .addState(TIMEOUT, [ WAITING ])
        ;

      function updateState(fbInfo) {
        self.show(fbInfo.status || fbService.WAITING);
      }

      fbInfo.addPlugin(self);

      updateState(fbService.value);
      fbService.addChangeListener(updateState);
    });

    c.extendPrototype({
      open: function() {
        fbService.open();
        return ui.Carton.prototype.open.call(this);
      },
      requestClose: function() {
        this.invokePlugin("requestClose");
      }
    });
  });
});
