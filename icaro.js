(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.icaro = factory());
}(this, (function () { 'use strict';

// fork of https://github.com/YuzuJS/setImmediate
((function (global) {
  if (global.setImmediate) {
    return
  }

  const tasksByHandle = {};

  let nextHandle = 1; // Spec says greater than zero
  let currentlyRunningATask = false;
  let registerImmediate;

  function setImmediate(callback) {
    tasksByHandle[nextHandle] = callback;
    registerImmediate(nextHandle);
    return nextHandle++
  }

  function clearImmediate(handle) {
    delete tasksByHandle[handle];
  }

  function runIfPresent(handle) {
    // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
    // So if we're currently running a task, we'll need to delay this invocation.
    if (currentlyRunningATask) {
      // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
      // "too much recursion" error.
      setTimeout(runIfPresent, 0, handle);
    } else {
      const task = tasksByHandle[handle];
      if (task) {
        currentlyRunningATask = true;
        try {
          task();
        } finally {
          clearImmediate(handle);
          currentlyRunningATask = false;
        }
      }
    }
  }

  function installNextTickImplementation() {
    registerImmediate = handle => {
      process.nextTick(() => { runIfPresent(handle); });
    };
  }

  function installPostMessageImplementation() {
    // Installs an event handler on `global` for the `message` event: see
    // * https://developer.mozilla.org/en/DOM/window.postMessage
    // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages
    const messagePrefix = `setImmediate$${Math.random()}$`;
    const onGlobalMessage = event => {
      if (event.source === global &&
                typeof event.data === 'string' &&
                event.data.indexOf(messagePrefix) === 0) {
        runIfPresent(+event.data.slice(messagePrefix.length));
      }
    };

    global.addEventListener('message', onGlobalMessage, false);

    registerImmediate = handle => {
      global.postMessage(messagePrefix + handle, '*');
    };
  }

  // Don't get fooled by e.g. browserify environments.
  if ({}.toString.call(global.process) === '[object process]') {
    // For Node.js before 0.9
    installNextTickImplementation();
  } else {
    // For non-IE10 modern browsers
    installPostMessageImplementation();
  }

  global.setImmediate = setImmediate;
  global.clearImmediate = clearImmediate;

}))(typeof self === 'undefined' ? typeof global === 'undefined' ? window : global : self);

const listeners = new WeakMap();
const dispatch = Symbol();
const isIcaro = Symbol();
const timer = Symbol();
const isArray = Symbol();
const changes = Symbol();

/**
 * Public api
 * @type {Object}
 */
const API = {
  /**
   * Set a listener on any object function or array
   * @param   {Function} fn - callback function associated to the property to listen
   * @returns {API}
   */
  listen(fn) {
    const type = typeof fn;
    if(type !== 'function')
      throw `The icaro.listen method accepts as argument "typeof 'function'", "${type}" is not allowed`

    if (!listeners.has(this)) listeners.set(this, []);
    listeners.get(this).push(fn);

    return this
  },

  /**
   * Unsubscribe to a property previously listened or to all of them
   * @param   {Function} fn - function to unsubscribe
   * @returns {API}
   */
  unlisten(fn) {
    const callbacks = listeners.get(this);
    if (!callbacks) return
    if (fn) {
      const index = callbacks.indexOf(fn);
      if (~index) callbacks.splice(index, 1);
    } else {
      listeners.set(this, []);
    }

    return this
  },

  /**
   * Convert the icaro object into a valid JSON object
   * @returns {Object} - simple json object from a Proxy
   */
  toJSON() {
    return Object.keys(this).reduce((ret, key) => {
      const value = this[key];
      ret[key] = value && value.toJSON ? value.toJSON() : value;
      return ret
    }, this[isArray] ? [] : {})
  }
};

/**
 * Icaro proxy handler
 * @type {Object}
 */
const ICARO_HANDLER = {
  set(target, property, value) {
    // filter the values that didn't change
    if (target[property] !== value) {
      if (value === Object(value) && !value[isIcaro]) {
        target[property] = icaro(value);
      } else {
        target[property] = value;
      }
      target[dispatch](property, value);
    }

    return true
  }
};

/**
 * Define a private property
 * @param   {*} obj - receiver
 * @param   {String} key - property name
 * @param   {*} value - value to set
 */
function define(obj, key, value) {
  Object.defineProperty(obj, key, {
    value:  value,
    enumerable: false,
    configurable: false,
    writable: false
  });
}

/**
 * Enhance the icaro objects adding some hidden props to them and the API methods
 * @param   {*} obj - anything
 * @returns {*} the object received enhanced with some extra properties
 */
function enhance(obj) {
  // add some "kinda hidden" properties
  Object.assign(obj, {
    [changes]: new Map(),
    [timer]: null,
    [isIcaro]: true,
    [dispatch](property, value) {
      if (listeners.has(obj)) {
        clearImmediate(obj[timer]);
        obj[changes].set(property, value);
        obj[timer] = setImmediate(function() {
          listeners.get(obj).forEach(function(fn) {fn(obj[changes]);});
          obj[changes].clear();
        });
      }
    }
  });

  // Add the API methods bound to the original object
  Object.keys(API).forEach(function(key) {
    define(obj, key, API[key].bind(obj));
  });

  // remap values and methods
  if (Array.isArray(obj)) {
    obj[isArray] = true;
    // remap the initial array values
    obj.forEach(function(item, i) {
      obj[i] = null; // force a reset
      ICARO_HANDLER.set(obj, i, item);
    });
  }

  return obj
}

/**
 * Factory function
 * @param   {*} obj - anything can be an icaro Proxy
 * @returns {Proxy}
 */
function icaro(obj) {
  return new Proxy(
    enhance(obj || {}),
    Object.create(ICARO_HANDLER)
  )
}

return icaro;

})));
