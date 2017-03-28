// sizegoal.js - A resize transition effect.

define([ "jquery" ], function($) {

  var DEFAULTS = {
    tick: 20,
    quantum: 10,
    decay: 0.98,
    epsilon: 1,
    componentProperty: "ele"
  };

  function now() {
    return new Date().getTime();
  }

  function SizeGoal(options) {
    $.extend(this, DEFAULTS, options);
    this.goals = [];

    var componentProperty = this.componentProperty;

    this.getCssValue = function(component, key) {
      var setting = component[componentProperty].css(key);
      return setting && parseFloat(setting);
    }

    this.setCssValue = function(component, key, value) {
      component[componentProperty].css(key, value);
    }
  }

  function kick(animation) {
    (function step() {
      setTimeout(function() {
        for (var i = 0; i < animation.goals.length; ) {
          var goal = animation.goals[i];
          var elapsedTime = now() - goal.startTime;
          var component = goal.component;
          var width = animation.getCssValue(component, "width");
          var height = animation.getCssValue(component, "height");
          var targetWidth = goal.targetWidth;
          var targetHeight = goal.targetHeight;
          if (Math.abs(targetWidth - width) < animation.epsilon &&
              Math.abs(targetHeight - height) < animation.epsilon) {
            animation.setCssValue(component, "width", targetWidth);
            animation.setCssValue(component, "height", targetHeight);
            goal.promise.resolve(component);
            animation.goals.splice(i, 1);
          }
          else {
            var delta = (targetWidth - width) * (1.0 - Math.pow(animation.decay, elapsedTime));
            animation.setCssValue(component, "width", width + delta);
            delta = (targetHeight - height) * (1.0 - Math.pow(animation.decay, elapsedTime));
            animation.setCssValue(component, "height", height + delta);
            ++i;
            goal.startTime = now();
          }
        }

        if (animation.goals.length) {
          step();
        }
      }, animation.tick);
    })();
  }

  function addGoal(animation, component, targetWidth, targetHeight) {
    for (var i = 0; i < animation.goals.length; ++i) {
      if (animation.goals[i].component == component) {
        animation.goals[i].targetWidth = targetWidth;
        animation.goals[i].targetHeight = targetHeight;
        return animation.goals[i].promise;
      }
    }

    var promise = $.Deferred();

    animation.goals.push({
      component: component,
      targetWidth: targetWidth,
      targetHeight: targetHeight,
      startTime: now(),
      promise: promise
    });

    if (animation.goals.length == 1) {
      kick(animation);
    }
    return promise;
  }

  SizeGoal.prototype.addGoal = function(component, targetWidth, targetHeight) {
    return addGoal(this, component, targetWidth, targetHeight);
  }

  return SizeGoal;
});
