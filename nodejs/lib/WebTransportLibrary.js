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
    try{
        transport.close()
        console.log("Connection closed gracefully")
    }catch (error){
        console.err("An error occurred while closing the connection: " + error)
    }
}

/**
 * Read data from a unidirectional or bidirectional incoming stream.
 * @param {import("@fails-components/webtransport").WebTransportReceiveStream} receiveStream The incoming stream.
 * @returns {Uint8Array | null} An object representing the received data.
 */
async function readData(receiveStream){
    const reader = receiveStream.getReader()
    try {
        const {done, value} = await reader.read()
        if(done) return null
        return value
    } catch (error) {
        console.error(`An error occurred while reading data from the incoming stream: ${error}`)
        return null
    }    
}

/**
 * Write data to a unidirectional or bidirectional outgoing stream.
 * @param {WritableStream<any>} outgoingStream The outgoing stream.
 * @param {string} data An object representing the data to be written.
 */
async function writeOnOutgoingStream(outgoingStream, data) {
    const writer = outgoingStream.getWriter()
    const toWrite = new TextEncoder().encode(data)
    writer.write(toWrite)
    try {
        writer.releaseLock()
        console.log("Data was successfully sent! " + data)
    } catch (error) {
        console.error(`An error occurred while closing the outgoing stream writer: ${error}`)
    }
    // writer.write(toWrite).then(() => {
    //     writer.close()
    //     console.log("Data was successfully sent!")
    // }).catch((error) => {
    //     console.error(`An error occurred while writing to the outgoing stream: ${error}`)
    // })
}

/**
 * Read data from a unidirectional incoming stream.
 * @param {ReadableStream<import("@fails-components/webtransport").WebTransportReceiveStream>} incomingStream The incoming unidirectional stream.
 * @returns {string | null} An object representing the received data.
 */
async function receiveFromIncomingUnidirectionalStream(incomingStream) {
    const reader = incomingStream.getReader()
    try {
        const { done, value } = await reader.read()
        if(done){
            return null
        }
        const data = await readData(value)
        return new TextDecoder().decode(data)
    } catch (error) {
        console.error(`An error occurred while reading from incoming stream: ${error}`)
        return null
    }
}


/**
 * Read data from a bidirectional incoming stream.
 * @param {ReadableStream<import("@fails-components/webtransport").WebTransportBidirectionalStream>} incomingStream The incoming bidirectional stream.
 * @returns {string | null} An object representing the received data.
 */
async function receiveFromIncomingBidirectionalStream(incomingStream) {
    const reader = incomingStream.getReader()
    try {
        const { done, value } = await reader.read()
        if(done){
            return null
        }
        const data = await readData(value.readable)
        return new TextDecoder().decode(data)
    } catch (error) {
        console.error(`An error occurred while reading from incoming stream: ${error}`)
        return null
    }
    
}

/**
 * Open a bidirectional stream.
 * @param {import("@fails-components/webtransport").WebTransportSession} session 
 * @returns Receive and send streams
 */
async function openBidirectionalStream(session){
    try {
        const biStream = await session.createBidirectionalStream()
        return { "rcvStream": biStream.readable, "wrStream": biStream.writable }
    } catch (error) {
        return null
    }
}

/**
 * Get the instance of the unidirectional incoming stream.
 * @param {ReadableStream<import("@fails-components/webtransport").WebTransportReceiveStream>} unidirectionalIncomingStream WebTransport connection unidirectional incoming streams.
 * @returns {import("@fails-components/webtransport").WebTransportReceiveStream} The unidirectional stream.
 */
async function receiveUnidirectionalStream(unidirectionalIncomingStream){
    const reader = unidirectionalIncomingStream.getReader()
    try {
        const { done, value } = await reader.read()
        if(done){
            return null
        }
        reader.releaseLock()
        return value
    } catch (error) {
        console.error(`An error occurred while getting unidirectional incoming stream: ${error}`)
        return null
    }
}

/**
 * Get the instance of the bidirectional incoming stream.
 * @param {ReadableStream<import("@fails-components/webtransport").WebTransportBidirectionalStream>} bidirectionalIncomingStream WebTransport connection bidirectional incoming streams.
 * @returns Receive and send streams of the bidirectional stream.
 */
async function receiveBidirectionalStream(bidirectionalIncomingStream){
    const reader = bidirectionalIncomingStream.getReader()
    try {
        const { done, value } = await reader.read()
        if(done){
            return null
        }
        reader.releaseLock()
        return { "receiveStream": value.readable, "sendStream": value.writable }
    } catch (error) {
        console.error(`An error occurred while getting bidirectional stream: ${error}`)
        return null
    }
}