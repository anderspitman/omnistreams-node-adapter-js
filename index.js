const process = require('process')
const { ConsumerStream } = require('omnistreams-core')


class WriteStreamAdapter extends ConsumerStream {
  constructor(options) {
    super()

    this._nodeStream = options.nodeStream
    const bufferSize = options.bufferSize

    const oldOnRequest = this.onRequest.bind(this)
    this.onRequest = (callback) => {
      oldOnRequest(callback)
      this._requestCallback(bufferSize)
    }

    this._nodeStream.on('close', () => {
      this.terminate()
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

      if (readyForMore) {
        this._paused = false
      }
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
    if (this._nodeStream !== process.stdout) {
      this._nodeStream.end()
    }
  }

  // TODO: need to handle when upstream terminates
  _terminate() {
      this._nodeStream.destroy()
      this._terminateCallback()
  }
}

module.exports = {
  WriteStreamAdapter,
}
