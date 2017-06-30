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

  function animateWidth(animation, goal) {
    var elapsedTime = now() - goal.startTime;
    var component = goal.component;
    var width = animation.getCssValue(component, "width");
    var targetWidth = goal.targetWidth;
    if (Math.abs(targetWidth - width) < animation.epsilon) {
      animation.setCssValue(component, "width", targetWidth);
      return false;
    }
    var delta = (targetWidth - width) * (1.0 - Math.pow(animation.decay, elapsedTime));
    animation.setCssValue(component, "width", width + delta);
    return true;
  }

  function animateHeight(animation, goal) {
    var elapsedTime = now() - goal.startTime;
    var component = goal.component;
    var height = animation.getCssValue(component, "height");
    var targetHeight = goal.targetHeight;
    if (Math.abs(targetHeight - height) < animation.epsilon) {
      animation.setCssValue(component, "height", targetHeight);
      return false;
    }
    var delta = (targetHeight - height) * (1.0 - Math.pow(animation.decay, elapsedTime));
    animation.setCssValue(component, "height", height + delta);
    return true;
  }

  function kick(animation) {
    (function step() {
      setTimeout(function() {
        for (var i = 0; i < animation.goals.length; ) {
          var goal = animation.goals[i];
          var keepGoing = false;
          if (goal.targetWidth != null) {
            keepGoing = animateWidth(animation, goal);
          }
          if (goal.targetHeight != null) {
            keepGoing = animateHeight(animation, goal) || keepGoing;
          }
          if (keepGoing) {
            goal.startTime = now();
            ++i;
          }
          else {
            goal.promise.resolve(goal.component);
            animation.goals.splice(i, 1);
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
