/**
 * A library for javascript WebTransport clients.
 * @author Moscao13 <mattia.mosconi2002@gmail.com>
 */

/**
 * Initialize the WebTransport connection.
 * @param   {String}            url The url of the endpoint you want to connect.
 * @return  {WebTransport | null}      An instance of the WebTransport connection.
 */
function initConnection(url){
    const transport = new WebTransport(url)
    transport.ready.then(() => {
        console.log("WebTransport connection ready!")
    }).catch((err) => {
        console.error(`An error occurred while opening the connection: ${err}`)
        return null
    })

    return transport
}

/**
 * Close the WebTransport connection.
 * @param {WebTransport} transport The instance of the WebTransport connection to be closed.
 */
function closeConnection(transport){
    transport.closed.then(() => {
        console.log("WebTransport connection successfully closed!")
    }).catch((err) => {
        console.error(`An error occurred while closing the connection: ${err}`)
    })
}

/**
 * Read data from a unidirectional or bidirectional incoming stream.
 * @param {ReadableStream<any>} receiveStream The incoming stream.
 * @returns {Uint8Array | null} An object representing the received data.
 */
async function readData(receiveStream){
    const reader = receiveStream.getReader()
    try {
        const {done, value} = await reader.read()
        if(!done) return null
        return data
    } catch (error) {
        console.error(`An error occurred while reading from the incoming stream: ${error}`)
        return null
    }    
}

/**
 * Write data to a unidirectional or bidirectional outgoing stream.
 * @param {WritableStream<any>} outgoingStream The outgoing stream.
 * @param {Uint8Array} data An object representing the data to be written.
 */
function writeOnOutgoingStream(outgoingStream, data) {
    const writer = outgoingStream.getWriter()
    writer.write(data).then(() => {
        writer.close()
        console.log("Data was successfully sent!")
    }).catch((error) => {
        console.error(`An error occurred while writing to the outgoing stream: ${error}`)
    })
}

/**
 * Read data from a unidirectional or bidirectional incoming stream.
 * @param {ReadableStream<any>} incomingStream The incoming stream.
 * @returns {Uint8Array | null} An object representing the received data.
 */
async function receiveFromIncomingStream(incomingStream) {
    const reader = incomingStream.getReader()

    try {
        const { done, value } = await reader.read()
        if(!done){
            return null
        }
        const data = readData(value)
        return data
    } catch (error) {
        console.error(`An error occurred while reading from incoming stream: ${error}`)
        return null
    }
    
}


