const fs = require('fs')
const { assert, expect } = require('chai')
const { ReadStreamAdapter } = require('../')

describe('ReadStreamAdapter', function() {
  it ('has a constructor', function() {
    const readStream = fs.createReadStream('writeStream')
    new ReadStreamAdapter({
      nodeStream: readStream,
      bufferSize: 1,
    })
  })
})

