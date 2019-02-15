const process = require('process')
const { Consumer } = require('omnistreams-core')


class UnbufferedWriteStreamAdapter extends Consumer {
  constructor(nodeStream) {
    super()

    this._ready = false
    this._nodeStream = nodeStream

    this._finished = false

    this._nodeStream.on('close', () => {
      if (!this._finished) {
        this.terminate()
      }
    })

    // Immediately request 1 element when onRequest is called. This gets things
    // flowing. Have to be sure to call the original version though
    this.onRequest = (callback) => {
      super.onRequest(callback)
      this._ready = true
      this._requestCallback(1)
    }
  }

  _write(data) {
    if (!this._ready) {
      throw "UnbufferedWriteStreamAdapter: Attempt to write more data than requested"
    }

    const readyForMore = this._nodeStream.write(data)
    if (!readyForMore) {
      this._ready = false
      this._nodeStream.once('drain', () => {
        this._ready = true
        this._requestCallback(1)
      })
    }
    else {
      // TODO: figure out how to test this path explicitly. The drain path
      // satisfies the tests but in theory could be much slower.
      this._requestCallback(1)
    }
  }

  _end() {
    this._finished = true
    this._nodeStream.end()
  }

  _terminate() {
    this._nodeStream.destroy()
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
    // if this._bufferedElements.length is not zero then we need to wait on the
    // drain above before closing the node stream
    if (this._bufferedElements.length === 0 && this._nodeStream !== process.stdout) {
      this._nodeStream.end()
    }
  }

  // TODO: need to handle when upstream terminates
  _terminate() {
    if (!this._terminated) {
      this._terminated = true

      this._nodeStream.destroy()
      this._terminateCallback()
    }
  }
}


module.exports = {
  WriteStreamAdapter,
  UnbufferedWriteStreamAdapter,
}
