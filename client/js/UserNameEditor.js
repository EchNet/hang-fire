// usereditor.js - User Editor component

define([ "jquery", "services", "Activity", "ui/index", "waitanim" ],
function($,        Services,   Activity,     ui,         WaitAnim) {

  var sessionManager = Services.sessionManager;

  function getUser() {
    if (!sessionManager.user) {
      sessionManager.user = {};
    }
    return sessionManager.user;
  }

  function getUserName() {
    return getUser().name || "";
  }

  function setUserName(userName) {
    getUser().name = userName;
  }

  function getUserId() {
    return getUser().id;
  }

  return Activity.defineClass(function(c) {

    function initController(self) {

      function block() {
        self.nameInput.enabled = false;
        self.updateButton.enabled = false;
        self.waitAnim.open();
      }

      function unblock() {
        self.nameInput.enabled = true;
        self.updateButton.enabled = self.nameInput.valid && self.nameInput.value != getUserName(); self.waitAnim.close();
      }

      function submit() {
        if (self.updateButton.enabled) {
          block();
          Services.apiService.updateUser(getUserId(), getUserName())
          .then(function() {
            unblock();
            sessionManager.refreshNow();
          })
          .catch(function(err) {
            unblock();
            console.log(err);
          });
        }
      }

      function createNameInput() {
        return new ui.TextInput().addPlugin({
          onChange: function() {
            unblock();
          },
          submit: function(name) {
            setUserName(name);
            submit();
          }
        })
        .setPlaceholder("(not set)");
      }

      function createUpdateButton() {
        return new ui.Button({ cssClass: "default" }).addPlugin({
          onClick: function() {
            self.nameInput.submit();
          }
        }).setLabel("Update");
      }

      self.nameInput = createNameInput();
      self.updateButton = createUpdateButton();
      self.waitAnim = new WaitAnim($("<span>"), { ndots: 3 });

      self._open = function() {
        self.nameInput.value = getUserName();
        unblock();
        setTimeout(function() {
          self.nameInput.select().focus();
        }, 100);
      }
    }

    c.defineInitializer(function() {
      var self = this;
      initController(self);
      self.ele
        .append($("<div>")
          .addClass("panel")
          .append($("<div>")
            .append($("<span>").text("Your user name is: ")
            .append(self.nameInput.ele)
            .append(self.updateButton.ele))
            .append(self.waitAnim.ele))
          .append($("<div>")
            .text("This is the name that is shown to other Living Connections users " +
                  "and appears in the invitations that you send."))
          );
    });

    c.extendPrototype({
      open: function() {
        this._open();
        return this;
      },
      exit: function() {
        this.invokePlugin("exit");
      }
    });
  });
});
