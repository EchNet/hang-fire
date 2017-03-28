// CreateInviteEditor.js - New invitation editor

define([ "jquery", "Activity", "VideoRecorder", "ui/index" ],
function($,        Activity,     VideoRecorder,   ui) {

  var NameAndEmailEditor = ui.Carton.defineClass(function(c) {

    function makeErrorLabel(text) {
      return new ui.Component({ html: "<span>", cssClass: "error" }).setText(text).setVisible(false);
    }

    c.defineProperty("email", {
      get: function() {
        return this.emailInput.value;
      }
    });

    c.defineProperty("name", {
      get: function() {
        return this.nameInput.value;
      }
    });

    c.defineInitializer(function() {
      var self = this;

      function inputsAreValid() {
        return self.emailInput.valid && self.nameInput.valid;
      }

      function makeInput(cons, placeholder) {
        var input = new cons("<span>", { required: true })
          .setPlaceholder(placeholder)
          .addPlugin({
            onChange: function() {
              self.okButton.enabled = inputsAreValid();
            },
            onFocus: function() {
              self.okButton.enabled = inputsAreValid();
            },
            onBlur: function() {
              input.validate();
            },
            onSubmit: function() {
              if (self.emailInput.valid && self.nameInput.value) {
                self.invokePlugin("openVideoRecorder");
              }
            }
          });
        return input;
      }

      self.nameInput = makeInput(ui.TextInput, "name")
        .addPlugin({
          onChange: function() {
            self.nameError.visible = false;
          },
          onInvalid: function() {
            self.nameError.visible = true;
          }
        });

      self.nameError = makeErrorLabel(" Name is required.");

      self.emailInput = makeInput(ui.EmailInput, "email address")
        .addPlugin({
          onChange: function() {
            self.emailError.visible = false;
          },
          onInvalid: function() {
            self.emailError.visible = true;
          }
        });

      self.emailError = makeErrorLabel(" A valid email address is required.");

      self.okButton = ui.Button.create("Record a message", function() {
        self.invokePlugin("openVideoRecorder");
      }).setEnabled(false);

      self.ele
        .append($("<div>").addClass("panel")
          .append($("<div>")
            .text("Give us a name and an email address, and we'll send an invitation in your name."))
          .append($("<div>")
            .text("The invitation email contains a link that your contact can use to sign into " +
              "Living Connections and connect with you."))
          .append($("<div>")
            .append(self.nameInput.ele)
            .append(self.nameError.ele))
          .append($("<div>")
            .append(self.emailInput.ele)
            .append(self.emailError.ele))
          .append($("<div>")
            .append(self.okButton.ele))
        )
    });

    c.extendPrototype({
      open: function() {
        var self = this;
        setTimeout(function() {
          self.nameInput.focus().select();
        }, 100);
        return self;
      }
    });
  });

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.nameAndEmailEditor = new NameAndEmailEditor().addPlugin(self);
      self.ele.append(self.nameAndEmailEditor.ele)
    });

    function openVideoRecorder(self) {
      var nameAndEmailEditor = self.nameAndEmailEditor;
      nameAndEmailEditor.visible = false;
      nameAndEmailEditor.close();

      self.videoRecorder = new VideoRecorder("<div>", {
        what: "invitation to " + self.nameAndEmailEditor.name + " <" + self.nameAndEmailEditor.email + ">"
      }).addPlugin(self).open();
      self.ele.append(self.videoRecorder.ele)
    }

    c.extendPrototype({
      open: function() {
        this.nameAndEmailEditor.open();
        return this;
      },
      openVideoRecorder: function() {
        return openVideoRecorder(this);
      },
      saveMessage: function(assetId) {
        return this.saveForm($.extend({}, this.data, {
          assetId: assetId,
          email: this.nameAndEmailEditor.email,
          name: this.nameAndEmailEditor.name
        }));
      },
      close: function() {
        if (this.videoRecorder) {
          this.videoRecorder.close();
        }
        return this;
      }
    });
  });
});
