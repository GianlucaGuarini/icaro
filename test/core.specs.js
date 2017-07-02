const assert = require('assert')

// require the lib
const icaro = require('../')

describe('icaro core', () => {
  it('it can listen simple object changes', function(done) {
    const i = icaro({})

    i.listen(function(changes) {
      assert.equal(changes.get('foo'), 'bar')
      done()
    })

    i.foo = 'bar'
  })

  it('it groups multiple changes together', function(done) {
    const i = icaro({})

    i.listen(function(changes) {
      assert.equal(changes.get('foo'), 'bar')
      assert.equal(changes.get('baz'), 'bar')
      done()
    })

    i.foo = 'bar'
    i.baz = 'bar'
  })

  it('it can listen arrays and sub children', function(done) {
    const i = icaro({})

    i.arr = []
    i.arr.listen(function(changes) {
      assert.ok(changes.get('push'))
      done()
    })

    i.arr.push('one')
    i.arr.push('two')
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

  it('array native methods will dispatch changes', function(done) {
    const i = icaro(['foo', 'bar'])
    i.listen(function(changes) {
      assert.ok(changes.get('map'))
      done()
    })
    i.map(v => v + '-meh')
  })
})
