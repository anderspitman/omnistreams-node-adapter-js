const { assert, expect } = require('chai')
const { Writable } = require('stream')
const { WriteStreamAdapter, UnbufferedWriteStreamAdapter } = require('../')

describe('UnbufferedWriteStreamAdapter', function() {
  describe('#constructor', function() {
    it ('exists', function() {
      const writeStream = new Writable({
        write(chunk, encoding, callback) {
        }
      })
      new UnbufferedWriteStreamAdapter(writeStream)
    })
  })

  describe('#write', function() {

    it ('single write goes through', function() {
      let data
      const writeStream = new Writable({
        write(chunk, encoding, callback) {
          data = chunk
        }
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)
      let written = false
      consumer.onRequest((numElements) => {
        if (!written) {
          written = true
          consumer.write(new Uint8Array([1,2,3]))
          expect(data).to.eql(new Uint8Array([1,2,3]))
        }
      })
    })

    it ('can only write once before drain', function() {
      const writeStream = new Writable({
        highWaterMark: 1,
        write(chunk, encoding, callback) {
          return false
        }
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)
      let written = false
      consumer.onRequest((numElements) => {
        if (!written) {
          written = true

          consumer.write(new Uint8Array([1]))
          expect(() => {
            consumer.write(new Uint8Array([1]))
          }).to.throw("UnbufferedWriteStreamAdapter: Attempt to write more data than requested")
        }
      })
    })

    it ('multiple writes go through', function() {
      let observed = []
      const writeStream = new Writable({
        highWaterMark: 1,
        write(chunk, encoding, callback) {
          observed.push(chunk)
        }
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)
      const input = [
        new Uint8Array([1,2,3]),
        new Uint8Array([4,5,6]),
      ]

      let index = 0
      consumer.onRequest((numElements) => {
        if (index < input.length) {
          consumer.write(input[index])
          index++
        }
        else {
          expect(observed).to.eql([
            new Uint8Array([1,2,3]),
            new Uint8Array([4,5,6]),
          ])
        }
      })
    })
  })

  describe('#end', function() {
    it("ends node stream", function(done) {

      const writeStream = new Writable({
        write(chunk, encoding, callback) {
        }
      })

      this.timeout(100)
      writeStream.on('finish', () => {
        done()
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)
      consumer.end()
    })
  })

  describe('#terminate', function() {
    it("terminates node stream", function(done) {

      const writeStream = new Writable({
        write(chunk, encoding, callback) {
        }
      })

      this.timeout(100)
      writeStream.on('close', () => {
        done()
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)
      consumer.terminate()
    })
  })

  describe('node events', function() {
    it("close before end terminates", function(done) {

      const writeStream = new Writable({
        write(chunk, encoding, callback) {
        }
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)

      this.timeout(100)
      consumer.onTermination(() => {
        done()
      })

      writeStream.emit('close')
    })

    it("close after end is fine", function() {

      const writeStream = new Writable({
        write(chunk, encoding, callback) {
        }
      })

      const consumer = new UnbufferedWriteStreamAdapter(writeStream)

      consumer.onTermination(() => {
        throw new Error("Should not have been terminated")
      })

      consumer.end()

      writeStream.emit('close')
    })
  })
})


