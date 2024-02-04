package main

import (
	"log"
	"net/http"
	"sync"
	"websockets/server/test"

	"github.com/gorilla/websocket"
)

func main() {

	certFile := "./cert.pem"
	keyFile := "./key.pem"

	/// Setting connections upgrader
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  256,
		WriteBufferSize: 256,
		WriteBufferPool: &sync.Pool{},
	}

	/// Creating endpoints for http3 server
	http.HandleFunc("/websockets/test", func(w http.ResponseWriter, r *http.Request) {
		c, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Print("upgrade:", err)
			return
		}

		go test.TestWebSockets(c)
	})

	/// Starting up server
	if err := http.ListenAndServeTLS("localhost:4433", certFile, keyFile, nil); err != nil {
		log.Printf("An error occurred while listening for a connection: %s\nShutting down...", err)
	}
}
