const process = require('process')
const fs = require('fs')
const { WriteStreamAdapter } = require('./index')

//const stream = new WriteStreamAdapter(process.stdout, 10)
const stream = new WriteStreamAdapter(fs.createWriteStream('out.txt'), 10)


const data = new Uint8Array(34)
  .fill(65, 0, 10)
  .fill(66, 10, 20)
  .fill(67, 20, 40)

const chunkSize = 10
let offset = 0
let prevOffset = 0

stream.onRequest((numElements) => {
  const remainder = data.byteLength - offset

  if (offset < data.byteLength - chunkSize) {

    prevOffset = offset
    offset += chunkSize

    stream.write(new Uint8Array(data.buffer, prevOffset, chunkSize))
  }
  else if (remainder > 0) {
    prevOffset = offset
    offset += remainder 
    stream.write(new Uint8Array(data.buffer, prevOffset, remainder))
  }
  else {
    stream.end()
  }
})

