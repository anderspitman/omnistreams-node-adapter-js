const fs = require('fs')
const { assert, expect } = require('chai')
const { WriteStreamAdapter } = require('../')

describe('WriteStreamAdapter', function() {
  it ('has a constructor', function() {
    const writeStream = fs.createWriteStream('writeStream')
    new WriteStreamAdapter({
      nodeStream: writeStream,
      bufferSize: 1,
    })
  })
})


