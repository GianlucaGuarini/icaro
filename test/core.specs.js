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
      assert.equal(changes.get('0'), 'one')
      assert.equal(changes.get('1'), 'two')
      done()
    })

    i.arr.push('one')
    i.arr.push('two')
  })
})
