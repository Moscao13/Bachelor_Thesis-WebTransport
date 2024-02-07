/**
 * A library for javascript WebTransport clients.
 * @author Moscao13 <mattia.mosconi2002@gmail.com>
 */

import { Http3Server, WebTransport } from "@fails-components/webtransport"

/**
 * Initialize the WebTransport connection.
 * @param   {String}            url The url of the endpoint you want to connect.
 * @param   {Object}            hashagrs The hashed secure certificate
 * @return  {WebTransport | null}      An instance of the WebTransport connection.
 */
export function initConnection(url, hashagrs){
    const transport = new WebTransport(url, hashagrs)
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
export function closeConnection(transport){
    try{
        transport.close()
    }catch (error){
        console.err("An error occurred while closing the connection: " + error)
    }
}

/**
 * Read data from a unidirectional or bidirectional incoming stream.
 * @param {import("@fails-components/webtransport").WebTransportReceiveStream} receiveStream The incoming stream.
 * @returns {Uint8Array | null} An object representing the received data.
 */
export async function readData(receiveStream){
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
 * @param {WritableStream<import("@fails-components/webtransport").WebTransportSendStream>} outgoingStream The outgoing stream.
 * @param {string} data An object representing the data to be written.
 */
export function writeOnOutgoingStream(outgoingStream, data) {
    const writer = outgoingStream.getWriter()
    const toWrite = new TextEncoder().encode(data)
    writer.write(toWrite).then(() => {
        writer.releaseLock()
        console.log("Data was successfully sent!")
    }).catch((error) => {
        console.error(`An error occurred while writing to the outgoing stream: ${error}`)
    })
}

/**
 * Open a bidirectional stream.
 * @param {import("@fails-components/webtransport").WebTransportSession} session 
 * @returns Receive and send streams of the bidirectional stream.
 */
export async function openBidirectionalStream(session){
    try {
        const biStream = await session.createBidirectionalStream()
        return { "receiveStream": biStream.readable, "sendStream": biStream.writable }
    } catch (error) {
        return null
    }
}

/**
 * Get the instance of the unidirectional incoming stream.
 * @param {ReadableStream<import("@fails-components/webtransport").WebTransportReceiveStream>} unidirectionalIncomingStream WebTransport connection unidirectional incoming streams.
 * @returns {import("@fails-components/webtransport").WebTransportReceiveStream} The unidirectional stream.
 */
export async function receiveUnidirectionalStream(unidirectionalIncomingStream){
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
export async function receiveBidirectionalStream(bidirectionalIncomingStream){
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