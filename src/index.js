import './set-immediate'

const listeners = new WeakMap(),
  dispatch = Symbol(),
  isIcaro = Symbol(),
  timer = Symbol(),
  isArray = Symbol(),
  changes = Symbol()

const ARRAY_METHODS_TO_REMAP = [
  ['map', 1],
  ['sort', 1],
  ['reverse', 1],
  ['pop', 1],
  ['push', 1],
  ['shift', 1],
  ['slice', 0],
  ['from', 0],
  ['isArray', 0],
  ['of', 0],
  ['concat', 0],
  ['copyWithin', 0],
  ['entries', 0],
  ['every', 0],
  ['fill', 0],
  ['filter', 0],
  ['find', 0],
  ['findIndex', 0],
  ['forEach', 0],
  ['includes', 0],
  ['indexOf', 0],
  ['join', 0],
  ['keys', 0],
  ['lastIndexOf', 0],
  ['reduce', 0],
  ['reduceRight', 0],
  ['some', 0],
  ['splice', 0],
  ['toLocaleString', 0],
  ['toSource', 0],
  ['toString', 0],
  ['unshift', 0],
  ['values', 0]
]

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
      target[dispatch](property, value)
      if (value === Object(value) && !value[isIcaro]) {
        target[property] = icaro(value)
      } else {
        target[property] = value
      }
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
 * Handle also array changes
 * @param   {array}    options.obj    - array to modify
 * @param   {string}   options.method - method name we want to use to modify the array
 * @param   {boolean}  options.shouldDispatch - will the method trigger a dispatch?
 * @param   {function} options.originalMethod - original array method
 * @param   {array} args - arguments to proxy to the original array method
 * @returns {*} whatever the array method natively returns
 */
function handleArrayMethod({ obj, method, shouldDispatch, originalMethod }, ...args) {
  const ret = originalMethod.apply(obj, args)
  if (shouldDispatch) obj[dispatch](method, obj)
  return ret
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
    // remap the inital array values
    obj.forEach(function(item, i) {
      obj[i] = null
      ICARO_HANDLER.set(obj, i, item)
    })

    ARRAY_METHODS_TO_REMAP.forEach(function([method, shouldDispatch]) {
      define(obj, method, handleArrayMethod.bind(null, {
        obj,
        method,
        shouldDispatch,
        originalMethod: obj[method]
      }))
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