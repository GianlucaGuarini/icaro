import './set-immediate'

const listeners = new WeakMap(),
  dispatch = Symbol(),
  isIcaro = Symbol(),
  timer = Symbol(),
  isArray = Symbol(),
  changes = Symbol()

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
    if(typeof fn !== "function"){
      return
    }
    if (!listeners.has(this)) listeners.set(this, [])
    listeners.get(this).push(fn)

    return this
  },

  /**
   * Unsubscribe to a property previously listened or to all of them
   * @param   {Function} fn - function to unsubscribe
   * @returns {API}
   */
  unlisten(fn) {
    const callbacks = listeners.get(this)
    if (!callbacks) return
    if (fn) {
      const index = callbacks.indexOf(fn)
      if (~index) callbacks.splice(index, 1)
    } else {
      listeners.set(this, [])
    }

    return this
  },

  /**
   * Convert the icaro object into a valid JSON object
   * @returns {Object} - simple json object from a Proxy
   */
  toJSON() {
    return Object.keys(this).reduce((ret, key) => {
      const value = this[key]
      ret[key] = value && value.toJSON ? value.toJSON() : value
      return ret
    }, this[isArray] ? [] : {})
  }
}

/**
 * Icaro proxy handler
 * @type {Object}
 */
const ICARO_HANDLER = {
  set(target, property, value) {
    // filter the values that didn't change
    if (target[property] !== value) {
      if (value === Object(value) && !value[isIcaro]) {
        target[property] = icaro(value)
      } else {
        target[property] = value
      }
      target[dispatch](property, value)
    }

    return true
  }
}

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
  })
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
        clearImmediate(obj[timer])
        obj[changes].set(property, value)
        obj[timer] = setImmediate(function() {
          listeners.get(obj).forEach(function(fn) {fn(obj[changes])})
          obj[changes].clear()
        })
      }
    }
  })

  // Add the API methods bound to the original object
  Object.keys(API).forEach(function(key) {
    define(obj, key, API[key].bind(obj))
  })

  // remap values and methods
  if (Array.isArray(obj)) {
    obj[isArray] = true
    // remap the initial array values
    obj.forEach(function(item, i) {
      obj[i] = null
      ICARO_HANDLER.set(obj, i, item)
    })
  }

  return obj
}

/**
 * Factory function
 * @param   {*} obj - anything can be an icaro Proxy
 * @returns {Proxy}
 */
export default function icaro(obj) {
  return new Proxy(
    enhance(obj || {}),
    Object.create(ICARO_HANDLER)
  )
}
