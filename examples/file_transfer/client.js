const fs = require('fs')
const WebSocket = require('isomorphic-ws')
const { encodeObject, decodeObject, Multiplexer } = require('omnistreams')
const { ReadStreamAdapter, WriteStreamAdapter } = require('omnistreams-node-adapter')

const ws = new WebSocket('ws://127.0.0.1:9001')


ws.onopen = () => {

  const mux = new Multiplexer()

  mux.setSendHandler((message) => {
    ws.send(message)
  })

  ws.addEventListener('message', (message) => {
    mux.handleMessage(message.data)
  })

  mux.onConduit((producer, metadata) => {

    const fileWriteStream = fs.createWriteStream('out.bam')

    const stdoutConsumer = new WriteStreamAdapter({
      nodeStream: fileWriteStream,
      bufferSize: 10,
    })
    producer.pipe(stdoutConsumer)

    stdoutConsumer.onFinish(() => {
      ws.close()
    })
  })

  const consumer = mux.createConduit()

  const fileReadStream = fs.createReadStream('in.bam')

  const stdinProducer = new ReadStreamAdapter({
    nodeStream: fileReadStream,
    bufferSize: 10,
  })

  stdinProducer.pipe(consumer)
}
