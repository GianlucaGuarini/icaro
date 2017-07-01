# icaro
Smart and efficient javascript object observer

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

<img src='./image.jpg' width='100%' />

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

# Usage

Icaro will let you listen all the changes happening in a javascript object or array grouping them efficiently optimizing the performances of your listeners

```js

const obj = icaro({})

// changes here is a javascript Map
// this is async
obj.listen(function(changes) {
  console.log(changes.get('foo')) // 'hi'
  console.log(changes.get('bar')) // 'there'
  console.log(changes.get('baz')) // 'dude'
})

obj.foo = 'hi'
obj.bar = 'dear'
obj.baz = 'dude'

```

Icaro will let you listen also nested object, all the non primitive properties added to an icaro object will be automatically converted into icaro observable objects

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

Icaro is able also to listen changes in arrays but only when their length changes

```js

const arr = icaro([])

arr.listen(function(changes) {
  console.log(changes.get('0')) // foo
  console.log(changes.get('1')) // bar
  // kill all the listeners
  arr.unlisten()
})

arr.push('foo')
arr.push('bar')

// no events here
arr.map(v => v + '-meh')

```
# API

Any icaro call will return an Proxy with the following api methods

## icaro.listen(callback)

Listen any object or array calling the callback function asynchronously grouping all the contiguous changes via [setImmediate](https://developer.mozilla.org/it/docs/Web/API/Window/setImmediate)

__@returns self__

## icaro.unlisten(callback|null)

Unsubscribing a callback previously subscribed to the object, if no callback is provided all the previous subscriptions will be cleared

__@returns self__

## icaro.toJSON

Return all data contained in an icaro Proxy as JSON object

__@returns HTMLElement__

[travis-image]:https://img.shields.io/travis/GianlucaGuarini/icaro.svg?style=flat-square
[travis-url]:https://travis-ci.org/GianlucaGuarini/icaro

[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE.txt

[npm-version-image]:http://img.shields.io/npm/v/icaro.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/icaro.svg?style=flat-square
[npm-url]:https://npmjs.org/package/icaro
