const WebSocket = require('ws')
const { encodeObject, decodeObject, Multiplexer } = require('omnistreams')

const wsServer = new WebSocket.Server({ port: 9001 })

wsServer.on('connection', (ws) => {

  const mux = new Multiplexer()

  mux.setSendHandler((message) => {
    ws.send(message)
  })

  ws.addEventListener('message', (message) => {
    mux.handleMessage(message.data)
  })

  mux.onConduit((producer, metadata) => {
    const echoConsumer = mux.createConduit()
    producer.pipe(echoConsumer)
  })
})
