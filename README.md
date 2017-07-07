# icaro
A smart and efficient javascript object observer, ideal for batching DOM updates (__~1kb__)

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

<img src='https://raw.githubusercontent.com/GianlucaGuarini/icaro/master/image.jpg' width='100%' />

# Installation

Via npm
```shell
$ npm i icaro -S
```

## Script import

Via `<script>`

```html
<script src='path/to/icaro.js'></script>
```

Via ES2015 modules

```js
import icaro from 'icaro'
```

Via commonjs

```js
const icaro = require('icaro')
```

# Demos

- [The Canvas](https://cdn.rawgit.com/GianlucaGuarini/icaro/v1.2.1/demos/canvas.html)
- [The Counter](https://cdn.rawgit.com/GianlucaGuarini/icaro/v1.2.1/demos/counter.html)
- [The Stress](https://cdn.rawgit.com/GianlucaGuarini/icaro/v1.2.1/demos/stress.html)

# Performance

`icaro` is really fast [compared to the other reactive libs](https://github.com/GianlucaGuarini/reactive-libs-bench) because it smartly throttles all the state changes.

# Usage

`icaro` will let you listen to all the changes happening in a javascript object or array, grouping them efficiently, and optimizing the performance of your listeners.

```js

const obj = icaro({})

// the variable "changes" here is a Map and the function is async
obj.listen(function(changes) {
  console.log(changes.get('foo')) // 'hi'
  console.log(changes.get('bar')) // 'there'
  console.log(changes.get('baz')) // 'dude'

  // kill all the listeners
  obj.unlisten()
})

obj.foo = 'hi'
obj.bar = 'there'
obj.baz = 'dude'

```

`icaro` will also let you listen to nested objects and all the non primitive properties added to an `icaro` object will be automatically converted into `icaro` observable objects.

```js
const obj = icaro({})

// listen only the changes happening on the root object
obj.listen(function(changes) {
})

obj.nested = {

}

obj.nested.listen(function(changes) {
  // listen only the changes of obj.nested
})

obj.nested.someVal = 'hello'

```

`icaro` is able also to listen changes in arrays. Any change to the items indexes will dispatch events.

```js

// Here a bit of hardcore async stuff

const arr = icaro([])

// here you will get the index of the items added or who changed their position
arr.listen(function(changes) {
  console.log(changes.get('0')) // 'foo'
  console.log(changes.get('1')) // 'bar'
  // kill all the listeners this included
  arr.unlisten()

  // add a brand new listener recursively.. why not?
  arr.listen(function(changes) {
    // the change was triggered by a 'reverse' and all indexes were updated
    console.log(changes.get('0')) // 'bar'
    console.log(changes.get('1')) // 'foo'
  })

  // update all the indexes
  arr.reverse()
})

// initial dispatch
arr.push('foo')
arr.push('bar')

```

You can also avoid unsubscribing ("unlisten") because `icaro` will automatically remove event listeners when the object is about to be garbage collected.

# API

Any `icaro` call will return a Proxy with the following api methods

## icaro.listen(callback)

Listen any object or array calling the callback function asynchronously grouping all the contiguous changes via [setImmediate](https://developer.mozilla.org/en/docs/Web/API/Window/setImmediate)

__@returns self__

## icaro.unlisten(callback|null)

Unsubscribing a callback previously subscribed to the object, if no callback is provided all the previous subscriptions will be cleared

__@returns self__

## icaro.toJSON()

Return all data contained in an `icaro` Proxy as JSON object

__@returns Object__

# Support

`icaro` uses advanced es6 features like [Proxies](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy), [WeakMaps](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/WeakMap), [Maps](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) and [Symbols](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Symbol) and __it targets only modern browsers__

All major evergreen browsers (Edge, Chrome, Safari, Firefox) [should be supported](http://caniuse.com/#search=Proxy)

[travis-image]:https://img.shields.io/travis/GianlucaGuarini/icaro.svg?style=flat-square
[travis-url]:https://travis-ci.org/GianlucaGuarini/icaro

[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE.txt

[npm-version-image]:http://img.shields.io/npm/v/icaro.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/icaro.svg?style=flat-square
[npm-url]:https://npmjs.org/package/icaro
