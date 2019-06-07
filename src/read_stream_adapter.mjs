import { Producer } from 'omnistreams';


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

    nodeStream.on('data', (data) => {

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
      this._endCallback()
    }
  }
}


export { ReadStreamAdapter };
