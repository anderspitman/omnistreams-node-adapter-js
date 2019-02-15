const { assert, expect } = require('chai')
const { Readable } = require('stream')
const { ReadStreamAdapter } = require('../')

describe('ReadStreamAdapter', function() {
  it ('has a constructor', function() {

    const readStream = new Readable({
      read() {
      }
    })

    new ReadStreamAdapter({
      nodeStream: readStream,
      bufferSize: 1,
    })
  })
})

