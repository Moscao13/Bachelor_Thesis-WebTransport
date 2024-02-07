import { WebTransport } from "@fails-components/webtransport"
import { initConnection, closeConnection, writeOnOutgoingStream } from '../../lib/WebTransportModule.js'

/// Test webtransport client single stream single client
export async function singleStreamSingleClientWebTransport(){

    const args = { hostname: 'localhost', port: 8080 }
    const hashes = {
      serverCertificateHashes: [
        {
          algorithm: 'sha-256',
          value: ''//Insert here certificate fingerprint
        }
      ]
    }
    const url = 'https://' + args.hostname + ':' + args.port + '/webtransport/test'
    console.log('Starting connection...' + url)
    const hashargs = {
      ...hashes,
      serverCertificateHashes: hashes.serverCertificateHashes.map((el) => ({
        algorithm: el.algorithm,
        value: Buffer.from(el.value.split(':').map((el) => parseInt(el, 16)))
      }))
    }

    let transport = new WebTransport(url, hashargs)
    transport.closed
      .then(() => {
        console.log('The HTTP/3 connection to ', url, 'closed gracefully.')
      })
      .catch((error) => {
        console.error(`An error occurred while closing the WebTransport connection: ${error}`)
      })
  
    await transport.ready
    console.log('WebTransport connection is ready')

    const biStream = await transport.createBidirectionalStream()
    writeOnOutgoingStream(biStream.writable, "ciao")
    const resp = new TextDecoder().decode(await readData(biStream.readable))
    console.log(resp)
    await biStream.close
    closeConnection(transport)
}

/// Test webtransport client multi stream single client
export async function multiStreamSingleClientWebTransport(){
    const args = { hostname: '127.0.0.1', port: 8080 }
    const hashes = {
      serverCertificateHashes: [
        {
          algorithm: 'sha-256',
          value:
            'CF:2A:BC:22:7C:97:B2:96:78:34:59:2E:42:1C:FB:87:BB:9E:22:DB:DF:A7:4B:C2:B4:71:88:0D:B6:8E:63:8B'
        }
      ]
    }


    const url = 'https://' + args.hostname + ':' + args.port + '/webtransport/test'
    console.log('Starting connection...')
    const hashargs = {
      ...hashes,
      serverCertificateHashes: hashes.serverCertificateHashes.map((el) => ({
        algorithm: el.algorithm,
        value: Buffer.from(el.value.split(':').map((el) => parseInt(el, 16)))
      }))
    }

    console.log('hashagrs', hashargs)
    const transport = new WebTransport(url, hashargs)
    transport.closed
      .then(() => {
        console.log('The HTTP/3 connection to ', url, 'closed gracefully.')
      })
      .catch((error) => {
        console.error(`An error occurred while closing the WebTransport connection: ${error}`)
      })
  
    await transport.ready
    console.log('WebTransport connection is ready')


    /// CODICE
}