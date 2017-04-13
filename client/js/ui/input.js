// input.js - Base component class for various types of <input>

define([ "jquery", "ui/component", ], function($, Component) {

  return Component.defineClass(function(c) {

    c.defineDefaultOptions({
      html: "<span>",
      invalidCssClass: "invalid"
    });

    function onChange(self) {
      self.clearStyles();
      self.notifyChangeListeners();   // deprecated
      self.invokePlugin("onChange", self.value);
    }

    c.defineInitializer(function() {
      var self = this;
      self._enabled = true;
      self.container.append($("<input>")
        .on("focus", function() {
          self.invokePlugin("onFocus", self.value);
        })
        .on("blur", function() {
          self.validate();
          self.invokePlugin("onBlur", self.value);
        })
        .on("keydown", function(event) {
          if (self.enabled && event.originalEvent.keyCode == 13) {
            self.submit();
          }
          return true;
        })
        .on("keyup", function(event) {
          if (self.enabled) {
            var keyCode = event.originalEvent.keyCode;
            if (keyCode >= 32 || keyCode == 8) {
              onChange(self);
            }
          }
          return true;
        })
        .on("change paste", function() {
          onChange(self);
        }));
    });

    c.defineProperty("input", {
      get: function() {
        return this.container.find("input");
      }
    });

    c.defineProperty("value", {
      get: function() {
        return this._filterOutValue(this.input.val());
      },
      set: function(val) {
        val = this._filterInValue(val);
        if (val != this.input.val()) {
          this.input.val(val);
          this.notifyChangeListeners();
        }
      }
    });

    c.defineProperty("valid", {
      get: function() {
        if (this.value === "" && this.options.required) {
          return false;
        }
        return this._isValueValid(this.value);
      }
    });

    c.defineProperty("enabled", {
      get: function() {
        return this._enabled;
      },
      set: function(enabled) {
        var self = this;
        enabled = !!enabled;   // coerce to boolean
        self._enabled = enabled;
        self.input.attr("disabled", !enabled);
        self.input.attr("readonly", !enabled);
      }
    });

    c.extendPrototype({
      _isValueValid: function(value) {
        return true;
      },

      _filterInValue: function(value) {
        return value;
      },

      _filterOutValue: function(value) {
        return value;
      },

      validate: function() {
        var self = this;
        var valid = self.valid;
        if (valid) {
          self.clearStyles();
        }
        else {
          self.input.addClass(self.options.invalidCssClass);
          self.invokePlugin("onInvalid", self.value);
        }
        return valid;
      },

      submit: function() {
        var self = this;
        var isValid = self.validate();
        if (isValid) {
          self.invokePlugin("submit", self.value);   // deprecated
          self.invokePlugin("onSubmit", self.value);
        }
        else {
          self.input.focus().select();
          self.invokePlugin("showInvalid");  // deprecated
        }
      },

      focus: function() {
        this.input.focus();
        return this;
      },

      select: function() {
        this.input.select();
        return this;
      },

      clearStyles: function() {
        this.input.removeClass(this.options.invalidCssClass);
      }
    });
  });
});
