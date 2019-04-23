const { assert, expect } = require('chai')
const { Readable } = require('stream')
import { ReadStreamAdapter } from '../index.mjs';

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

