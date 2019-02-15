const process = require('process')
const { Consumer } = require('omnistreams-core')


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
  WriteStreamAdapter
}
