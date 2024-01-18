import { readFileSync, createWriteStream } from "fs";
import { Http3Server } from "@fails-components/webtransport"
import { generateWebTransportCertificate } from "./certificate.js"
import { initConnection, closeConnection, writeOnOutgoingStream, openBidirectionalStream, receiveUnidirectionalStream, receiveBidirectionalStream, readData } from './lib/WebTransportModule.js'

// Log settings section
const log_file = createWriteStream("./server.log", {flags: 'a'})
log_file.write(`------------------------------------------------\nStarting new server instance\n`)

console.log = function(value){
  log_file.write(`${new Date()} INFO: ${value}\n`)
}

console.error = function(value){
  log_file.write(`${new Date()} ERROR: ${value}\n`)
}
// End log settings section


let certificate = readFileSync("./cert.pem").toString()
let privateKey = readFileSync("./key.pem").toString()
//let certificate
if (!certificate) {
  const attrs = [
    { shortName: 'C', value: 'DE' },
    { shortName: 'ST', value: 'Berlin' },
    { shortName: 'L', value: 'Berlin' },
    { shortName: 'O', value: 'webtransport Test Server' },
    { shortName: 'CN', value: '127.0.0.1' }
  ]
  certificate = await generateWebTransportCertificate(attrs, {
    days: 13
  })
}

 //console.log('certificate hash ', certificate.fingerprint)
 //console.log('certificate cert ', certificate.cert)
 //console.log('certificate key ', certificate.private)

try {
  const h3Server = new Http3Server({
    port: 8080,
    host: "0.0.0.0",
    secret: "moscao13",
    cert: certificate,
    privKey: privateKey,
  });
  h3Server.onServerListening = function(){
    console.log(`Server listening at ${h3Server.args.host}:${h3Server.args.port}`)
  }

  echo(h3Server)
  h3Server.startServer();
} catch (error) {
  console.error(error)
}

/**
 * Endpoint for echo function (/echo)
 * @param {Http3Server} server 
 */
async function echo(server){
  let isActiveSession = false
  try {
    const sessionStream = await server.sessionStream('/echo')
    const sessionReader = sessionStream.getReader()
    while(true){
      const { done, value } = await sessionReader.read()
      await value.ready
      if (done) {
        console.log('Server is gone')
      }
      console.log('New session opened')
      await value.ready
      console.log('Session is ready')

      const waitForClosure = async (session) => {
        try {
          await session.closed
          isActiveSession = false
          console.log("Session was successfully closed")
        } catch (error) {
          console.error(`An error occurred while closing session: ${error}`)
        }
      }
      
      waitForClosure(value)
      isActiveSession = true

      while(isActiveSession){
        const bi = await receiveBidirectionalStream(value.incomingBidirectionalStreams)
        if(!isActiveSession) break
        const res = new TextDecoder().decode(await readData(bi.receiveStream))
        writeOnOutgoingStream(bi.sendStream, res.toUpperCase())
        console.log(`result: ${res}`)
      }
      await value.closed
      //value.close()
    }
  } catch (error) {
    console.log(`An error occurred: ${error}`)
  }
}

