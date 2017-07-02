import './set-immediate'

const listeners = new WeakMap(),
  dispatch = Symbol(),
  timer = Symbol(),
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
    return Object.keys(this).reduce(function(ret, key) {
      const value = this[key]
      ret[key] = value && value.toJSON ? value.toJSON() : value
      return ret
    }, {})
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
      target[dispatch](property, value)
      if (value === Object(value)) {
        target[property] = icaro(value)
      } else {
        target[property] = value
      }
    }

    return true
  }
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
    obj[key] = API[key].bind(obj)
  })

  // remap values
  if (Array.isArray(obj)) {
    obj.forEach(function(item, i) {
      // remove temporarily the value in order to skip the icaro filters
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
    enhance(obj),
    Object.create(ICARO_HANDLER)
  )
}