import { WebSocketServer } from "ws"
import fs from "fs"
import { createServer } from "https"

const options = {
  key: fs.readFileSync(`./key.pem`),
  cert: fs.readFileSync(`./cert.pem`),
  rejectUnauthorized: false
};

const server = createServer(options, (req, res)=>{})
server.listen(443, ()=>{})

server.on("listening", ()=>{
    console.log("message")
})

const wsServer = new WebSocketServer({ server: server })

wsServer.on("connection", (connection) => {
    connection.on("message", (data, isBinary) => {
        connection.send(data.toString())
        console.log("Data was successfully sent!")
    })

    connection.on("close", (code, desc) => {
        console.log(`Websocket closed with exit code ${code}: ${desc}`)
    })
})