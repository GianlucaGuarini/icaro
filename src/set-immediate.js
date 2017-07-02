// fork of https://github.com/YuzuJS/setImmediate
((function (global) {
  if (global.setImmediate) {
    return
  }

  const tasksByHandle = {}

  let nextHandle = 1 // Spec says greater than zero
  let currentlyRunningATask = false
  let registerImmediate

  function setImmediate(callback) {
      // Callback can either be a function or a string
    if (typeof callback !== 'function') {
      callback = new Function(`${callback}`)
    }

    tasksByHandle[nextHandle] = callback
    registerImmediate(nextHandle)
    return nextHandle++
  }

  function clearImmediate(handle) {
    delete tasksByHandle[handle]
  }

  function runIfPresent(handle) {
    // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
    // So if we're currently running a task, we'll need to delay this invocation.
    if (currentlyRunningATask) {
      // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
      // "too much recursion" error.
      setTimeout(runIfPresent, 0, handle)
    } else {
      const task = tasksByHandle[handle]
      if (task) {
        currentlyRunningATask = true
        try {
          task()
        } finally {
          clearImmediate(handle)
          currentlyRunningATask = false
        }
      }
    }
  }

  function installNextTickImplementation() {
    registerImmediate = handle => {
      process.nextTick(() => { runIfPresent(handle) })
    }
  }

  function installPostMessageImplementation() {
    // Installs an event handler on `global` for the `message` event: see
    // * https://developer.mozilla.org/en/DOM/window.postMessage
    // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages
    const messagePrefix = `setImmediate$${Math.random()}$`
    const onGlobalMessage = event => {
      if (event.source === global &&
                typeof event.data === 'string' &&
                event.data.indexOf(messagePrefix) === 0) {
        runIfPresent(+event.data.slice(messagePrefix.length))
      }
    }

    global.addEventListener('message', onGlobalMessage, false)

    registerImmediate = handle => {
      global.postMessage(messagePrefix + handle, '*')
    }
  }

  // Don't get fooled by e.g. browserify environments.
  if ({}.toString.call(global.process) === '[object process]') {
    // For Node.js before 0.9
    installNextTickImplementation()
  } else {
    // For non-IE10 modern browsers
    installPostMessageImplementation()
  }

  global.setImmediate = setImmediate
  global.clearImmediate = clearImmediate

}))(typeof self === 'undefined' ? typeof global === 'undefined' ? window : global : self)
