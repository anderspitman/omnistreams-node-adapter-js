const process = require('process')
const { Producer, Consumer } = require('omnistreams-core')


// TODO: should probably allow the user to specify a chunk size and
// guarantee all but the last chunk are that size
class ReadStreamAdapter extends Producer {
  constructor({ nodeStream, bufferSize }) {
    super()

    this._nodeStream = nodeStream
    this._bufferSize = bufferSize

    const queue = []
    this._queue = queue

    this._allRead = false

    this._bytesRead = 0
    this._bytesWritten = 0

    nodeStream.on('data', (data) => {

      this._bytesRead += data.length

      queue.push(data)

      this._flushData()

      if (queue.length >= bufferSize) {
        nodeStream.pause()
      }
    })

    this._nodeStream.on('end', () => {
      this._allRead = true
    })
  }

  _demandChanged(numElements) {

    this._flushData()

    if (this._nodeStream.isPaused() && this._queue.length < this._bufferSize) {
      this._nodeStream.resume()
    }
  }

  _flushData() {
    while (this._demand > 0 && this._queue.length > 0) {
      const data = new Uint8Array(this._queue.shift())
      this._bytesWritten += data.length
      this._dataCallback(data)
      this._demand--
    }

    if (this._allRead && this._queue.length === 0) {
      console.log("total read: " + this._bytesRead)
      console.log("total written: " + this._bytesWritten)
      this._endCallback()
    }
  }
}


// TODO: probably have a warning or something if buffer size is exceeded
class WriteStreamAdapter extends Consumer {
  constructor(options) {
    super()

    this._nodeStream = options.nodeStream
    const bufferSize = options.bufferSize

    let finished = false
    this._allReceived = false

    const oldOnRequest = this.onRequest.bind(this)
    this.onRequest = (callback) => {
      oldOnRequest(callback)
      this._requestCallback(bufferSize)
    }

    this._nodeStream.on('close', () => {
      if (!finished) {
        this.terminate()
      }
    })

    this._nodeStream.on('drain', () => {

      let readyForMore = true

      while (this._bufferedElements.length > 0) {
        const element = this._bufferedElements.shift()
        readyForMore = this._nodeStream.write(Buffer.from(element))
        this._requestCallback(1)

        if (!readyForMore) {
          break
        }
      }

      // all done
      if (this._allReceived && this._bufferedElements.length === 0) {
          if (this._nodeStream !== process.stdout) {
            this._nodeStream.end()
          }
      }

      if (readyForMore) {
        this._paused = false
      }
    })

    this._nodeStream.on('finish', () => {
      finished = true
      this._finishCallback()
    })

    this._bufferedElements = []
  }

  _write(data) {

    if (!this._paused) {
      const readyForMore = this._nodeStream.write(Buffer.from(data))
      this._requestCallback(1)

      if (!readyForMore) {
        this._paused = true
      }
    }
    else {
      this._bufferedElements.push(data)
    }
  }

  _end() {
    this._allReceived = true
  }

  // TODO: need to handle when upstream terminates
  _terminate() {
    this._nodeStream.destroy()
    this._terminateCallback()
  }
}

module.exports = {
  ReadStreamAdapter,
  WriteStreamAdapter,
}
