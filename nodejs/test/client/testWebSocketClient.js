import { readFileSync, createWriteStream } from "fs";
import WebSocket from "ws"

/*
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
*/

async function sendData(ws, i){
    ws.send("hello:" + i)
    console.log("message sent")
    
}

/*-----------------------------------------------------------------------------------------------------------*/
/// Test websocket client single stream single client
export function singleStreamSingleClientWebSockets(){
    const cert = readFileSync(`../server/websockets/cert.pem`).toString()
    const ws = new WebSocket("wss://localhost:443", {rejectUnauthorized: false, cert: cert})

    ws.on("open", ()=>{
        console.log("ok")
        for(var i = 0; i < 100; i++){
            sendData(ws, i)
        }
        
    })

    ws.on("message", (data, isBinary) => {
        console.log("Received: " + data)
    })

    ws.on("error", (err) => {
        console.log(`Connection failed: ${err.message}`)
    })

}

/*-----------------------------------------------------------------------------------------------------------------------*/
async function multiSocketThread(){
    const ws = new ClientWebSocket()

    ws.on("connect", (connection)=>{
        connection.on("message", (message)=>{
            //console.log("Received: " + message.utf8Data)
        })

        for(var i = 0; i < 100; i++){
            sendData(connection, i)
        }
        
    })

    ws.connect("ws://localhost:1337")
}

/// Test websocket client multi stream single client
export function multiStreamSingleClientWebSockets(){
    for(var i = 0; i < 50; i++){
        multiSocketThread()
    }    
}