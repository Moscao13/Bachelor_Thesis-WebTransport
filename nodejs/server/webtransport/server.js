import { readFileSync, createWriteStream } from "fs";
import { Http3Server } from "@fails-components/webtransport"
import { generateWebTransportCertificate } from "../../certificate.js"
import { initConnection, closeConnection, writeOnOutgoingStream, openBidirectionalStream, readData } from '../../lib/WebTransportModule.js'

async function receiveBidirectionalStream(bidirectionalIncomingStream){
    const reader = bidirectionalIncomingStream.getReader()
    try {
      const { done, value } = await reader.read()
      if(done){
        return
      }
      reader.releaseLock()
      serverThread(value)
      receiveBidirectionalStream(bidirectionalIncomingStream)
    } catch (error) {
      console.error(`An error occurred while getting bidirectional stream: ${error}`)
      return
    }
  }
  
  async function serverThread(bistream){
    const res = new TextDecoder().decode(await readData(bistream.readable))
    writeOnOutgoingStream(bistream.writable, res)
  }

let certificate = readFileSync("./cert.pem").toString()
let privateKey = readFileSync("./key.pem").toString()

try {
  const h3Server = new Http3Server({
    port: 8080,
    host: "127.0.0.1",
    secret: "moscao13",
    cert: certificate,
    privKey: privateKey,
  });
  h3Server.onServerListening = function(){
    console.log(`Server listening at ${h3Server.args.host}:${h3Server.args.port}`)
  }

  h3Server.onServerError = function(error){
    console.log(`server error: ${error.message}`)
  }

  h3Server.onServerClose = function(){
    console.log("Server close")
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
    const sessionStream = await server.sessionStream('/webtransport/test')
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

      
      receiveBidirectionalStream(value.incomingBidirectionalStreams)
      await value.closed
      //value.close()
    }
  } catch (error) {
    console.log(`An error occurred: ${error}`)
  }
}