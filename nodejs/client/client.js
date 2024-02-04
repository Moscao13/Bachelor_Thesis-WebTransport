import { WebTransport } from "@fails-components/webtransport"
import { initConnection, closeConnection, writeOnOutgoingStream } from '../lib/WebTransportModule.js'

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
            'A0:A7:37:76:34:4A:D0:06:EA:4B:3B:07:1B:28:0A:32:C2:1E:22:B1:15:57:30:4E:BB:A1:39:5C:5C:F1:C4:BF'
        }
      ]
    }
  )