const assert = require('assert')

// require the lib
const icaro = require('../')

describe('icaro core', () => {
  it('it can listen simple object changes', function(done) {
    const i = icaro()

    i.listen(function(changes) {
      assert.equal(changes.get('foo'), 'bar')
      done()
    })

    i.foo = 'bar'
  })

  it('does not throws error when listener is not a valid function', function(done) {
    const i = icaro()

    i.listen({})

    try{
      i.foo = 'bar'
    } catch(e){
      assert.fail(null, null, 'Throws exception if listener is not a valid function')
    }
    done()
  })

  it('it groups multiple changes together', function(done) {
    const i = icaro()

    i.listen(function(changes) {
      assert.equal(changes.get('foo'), 'bar')
      assert.equal(changes.get('baz'), 'bar')
      done()
    })

    i.foo = 'bar'
    i.baz = 'bar'
  })

  it('it can listen arrays and sub children', function(done) {
    const i = icaro()

    i.arr = []
    i.arr.listen(function(changes) {
      assert.equal(changes.get('0'), 'one')
      assert.equal(changes.get('1'), 'two')
      done()
    })

    i.arr.push('one')
    i.arr.push('two')
  })

  it('it can listen array changes', function(done) {
    const arr = icaro(['one', 'two'])

    // can loop
    arr.listen(function() {
      arr.unlisten()
      arr.listen(function() {
        done()
      })
      arr.pop()
    })

    arr.shift()
  })

  it('it can loop arrays', function() {
    const arr = icaro(['one', 'two'])
    const test = []
    // can loop
    arr.forEach(function(item) {
      assert.ok(typeof item === 'string')
      test.push(item)
    })

    assert.ok(test.length === 2)

    for (let item in arr) {
      assert.ok(typeof item === 'string')
      test.push(item)
    }

    assert.ok(test.length === 4)
  })

  it('the toJSON call return properly either an object or an array', function() {
    const arr = icaro([1, 2])
    const obj = icaro({ uno: 1, due: 2 })

    assert.deepEqual(arr.toJSON(), [1, 2])
    assert.deepEqual(obj.toJSON(), { uno: 1, due: 2 })
  })


  it('array values should be listenable if objects', function() {
    const i = icaro([{ value: 'foo' }])
    assert.ok(i[0].listen)
  })

  it('"Array.reverse" will dispatch changes', function(done) {
    const i = icaro(['foo', 'bar'])
    i.listen(function(changes) {
      assert.equal(changes.get('0'), 'bar')
      assert.equal(changes.get('1'), 'foo')
      done()
    })
    i.reverse()
  })

  it('"Array.sort" will dispatch changes', function(done) {
    const i = icaro(['a', 'c', 'b'])
    i.listen(function(changes) {
      assert.ok(!changes.get('0')) // 'a' was never moved
      assert.equal(changes.get('1'), 'b')
      assert.equal(changes.get('2'), 'c')
      done()
    })
    i.sort()
  })
})
