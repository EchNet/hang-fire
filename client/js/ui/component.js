// component.js - component base

define([ "jquery", "ui/observable" ], function($, Observable) {

  var serial = 0; 

  function addCssClasses(ele, cssClass) {
    switch (typeof cssClass) {
    case "string":
      ele.addClass(cssClass);
      break;
    case "object":
      for (var i in cssClass) {
        ele.addClass(cssClass[i]);
      }
    }
  }

  function Component() {
    var self = this;
    var proto = Object.getPrototypeOf(self);
    var defaultOptions = proto.DEFAULT_OPTIONS;

    var ele, options = {};
    switch (arguments.length) {
    case 0:
      break;
    case 1:
      if (typeof arguments[0] === "string") {
        ele = arguments[0];
      }
      else {
        options = arguments[0];
      }
      break;
    default:
      ele = arguments[0];
      options = arguments[1];
    }

    options = $.extend({}, defaultOptions, options);

    ele = ele || options.selector || options.html;
    if (typeof ele === "string") {
      ele = $(ele);
    }

    Observable.call(self);
    self._ele = ele;
    self._visible = true;
    self._options = options;
    self._plugins = [];
    self._serial = serial++;

    addCssClasses(ele, options.cssClass);
    addCssClasses(ele, options.cssClasses);

    ele.click(function() {
      self.click();
    });
  }

  Component.prototype = $.extend(Object.create(Observable.prototype), {
    DEFAULT_OPTIONS: { html: "<div>" },

    addClass: function(className) {
      this.ele.addClass(className);
      return this;
    },

    append: function(child) {
      this.ele.append(child.ele);
      return this;
    },

    addPlugin: function(plugin) {
      var plugins = this._plugins;
      plugins.push(plugin);
      return this;
    },

    removePlugin: function(plugin) {
      var plugins = this._plugins;
      var ix = plugins.indexOf(plugin);
      if (ix >= 0) {
        plugins.splice(ix, 1);
      }
      return this;
    },

    invokePlugin: function(method) {
      var plugins = this._plugins;
      var args = Array.prototype.slice.call(arguments);
      var method = args.shift();
      var retval;
      for (var i = 0; i < plugins.length; ++i) {
        var plugin = plugins[i];
        if (method in plugin) {
          var thisRetval = plugin[method].apply(plugin, args);
          retval = retval || thisRetval;
        }
      }
      return retval;
    },

    open: function() {
      return this;
    },
    close: function() {
      return this;
    },

    focus: function() {
      this.ele.focus();
      return this;
    },

    click: function() {
      this.invokePlugin("onClick");
      return this;
    }
  });

  function defineProperty(proto, propName, propDesc) {
    Object.defineProperty(proto, propName, propDesc);
    if ("set" in propDesc) {
      proto["set" + propName.charAt(0).toUpperCase() + propName.substring(1)] = function(value) {
        this[propName] = value;
        return this;
      }
    }
  }

  function defineComponentProperty(propName, propDesc) {
    defineProperty(Component.prototype, propName, propDesc);
  }

  defineComponentProperty("container", {
    get: function() {
      return this._ele;
    }
  });
  defineComponentProperty("ele", {
    get: function() {
      return this._ele;
    }
  });
  defineComponentProperty("options", {
    get: function() {
      return this._options;
    }
  });
  defineComponentProperty("text", {
    get: function() {
      return this.ele.text();
    },
    set: function(text) {
      this.ele.text(text);
    }
  });
  defineComponentProperty("visible", {
    get: function() {
      return this._visible;
    },
    set: function(visible) {
      var self = this;
      visible = !!visible;
      if (self._visible != visible) {
        self._visible = visible;
        visible ? self.ele.show() : self.ele.hide();
      }
      return self;
    }
  });
  defineComponentProperty("enabled", {
    get: function() {
      return !this.ele.attr("disabled");
    },
    set: function(enabled) {
      enabled = !!enabled;
      if (this.enabled != enabled) {
        this.ele.attr("disabled", !enabled);
      }
    }
  });

  function defineClass(baseClass, definer) {
    var initializer = function() {};

    var newClass = function() {
      baseClass.apply(this, arguments);
      initializer.apply(this);
    }

    var proto = newClass.prototype = Object.create(baseClass.prototype);

    definer({
      defineInitializer: function(_initializer) {
        initializer = _initializer;
      },
      defineDefaultOptions: function(defaultOptions) {
        proto.DEFAULT_OPTIONS = $.extend({}, proto.DEFAULT_OPTIONS, defaultOptions);
      },
      extendPrototype: function(extension) {
        $.extend(proto, extension);
      },
      defineProperty: function(name, definition) {
        defineProperty(proto, name, definition);
      }
    });

    newClass.defineClass = function(definer) {
      return defineClass(newClass, definer);
    };

    return newClass;
  }

  Component.defineClass = function() {
    return defineClass(
      arguments.length > 1 ? arguments[0] : Component,
      arguments[arguments.length > 1 ? 1 : 0]
    );
  }

  return Component;
});
