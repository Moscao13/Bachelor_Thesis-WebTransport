import { WebTransport } from "@fails-components/webtransport"
import { initConnection, closeConnection, writeOnOutgoingStream, receiveFromIncomingStream } from './lib/WebTransportModule.js'

async function runClient(args, hashes) {
    const url = 'https://' + args.hostname + ':' + args.port + '/echo'
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

    const outUniStream = await transport.createUnidirectionalStream()
    writeOnOutgoingStream(outUniStream, "ciao")
    await outUniStream.close
    closeConnection(transport)

  }
  
  runClient(
    { hostname: '127.0.0.1', port: 8080 },
    {
      serverCertificateHashes: [
        {
          algorithm: 'sha-256',
          value:
            '37:64:64:E0:23:BB:67:57:EB:61:79:F6:47:02:4D:E9:D0:A9:D7:04:F5:72:AE:27:16:28:79:7F:01:3D:58:6F'
        }
      ]
    }
  )