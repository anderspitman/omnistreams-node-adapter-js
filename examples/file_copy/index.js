const process = require('process')
const fs = require('fs')
//const { encodeObject, decodeObject, Multiplexer } = require('omnistreams')
const { ReadStreamAdapter, WriteStreamAdapter } = require('omnistreams-node-adapter')

const fileReadStream = fs.createReadStream('in.bam')
const fileWriteStream = fs.createWriteStream('out.bam')

const producer = new ReadStreamAdapter({
  nodeStream: fileReadStream,
  bufferSize: 10,
})
//
//producer.onData((data) => {
//  fileWriteStream.write(data)
//  producer.request(1)
//})
//
//producer.onEnd(() => {
//  console.log("end")
//  fileWriteStream.close()
//})
//
//producer.request(1)

const consumer = new WriteStreamAdapter({
  nodeStream: fileWriteStream,
  bufferSize: 10,
})

producer.pipe(consumer)

consumer.onFinish(() => {
  //ws.close()
})

//fileReadStream.on('data', (data) => {
//  consumer.write(new Uint8Array(data))
//})
//
//fileReadStream.on('end', () => {
//  consumer.end()
//})
//
//let requested = 0
//consumer.onRequest((numElements) => {
//  requested += numElements
//})
//
//consumer.onFinish(() => {
//  console.log("Requested: " + requested)
//})

