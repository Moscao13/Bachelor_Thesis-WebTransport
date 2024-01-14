import { readFileSync } from "fs";
import { Http3Server } from "@fails-components/webtransport"
import { generateWebTransportCertificate } from './certificate.js'
import { initConnection, closeConnection, writeOnOutgoingStream, receiveFromIncomingUnidirectionalStream, receiveFromIncomingBidirectionalStream, openBidirectionalStream, receiveUnidirectionalStream, receiveBidirectionalStream, readData } from './lib/WebTransportModule.js'

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
    console.log(`Server listening at ${h3Server.host}:${h3Server.port}`)
  }

  echo(h3Server)
  h3Server.startServer();
} catch (error) {
  console.error(error)
}

/**
 * 
 * @param {Http3Server} server 
 */
async function echo(server){
  try {
    const sessionStream = await server.sessionStream('/echo')
    const sessionReader = sessionStream.getReader()
    while(true){
      const { done, value } = await sessionReader.read()
      await value.ready
      if (done) {
        console.log('Server is gone')
      }
      console.log('got a newsession')
      await value.ready
      console.log('server session is ready')
      const helpfunc = async () => {
        try {
          const err = await value.closed
          console.log('server session was closed', err)
        } catch (error) {
          console.log('server session close error:', error)
        }
      }
      //helpfunc()
      
      prova(value)

      while(f){
        const bi = await receiveBidirectionalStream(value.incomingBidirectionalStreams)
        if(!f) break
        const res = new TextDecoder().decode(await readData(bi.receiveStream))
        writeOnOutgoingStream(bi.sendStream, res.toUpperCase())
        console.log(`result: ${res}`)
      }
      console.log("stop")
      //await value.closed
      //value.close()
    }
  } catch (error) {
    console.log('An error occurred', error)
  }
}

let f = true

async function prova(x){
  await x.closed
  f = false

}