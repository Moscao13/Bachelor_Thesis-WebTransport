package test

import (
	"log"

	"github.com/gorilla/websocket"
)

var streamQty int = 100

func TestWebSockets(conn *websocket.Conn) {
	defer conn.Close()

	for i := 0; i < streamQty; i++ {
		_, message, rdErr := conn.ReadMessage()

		if rdErr != nil {
			log.Printf("An error occurred while opening websocket: %s", rdErr.Error())
			return
		}

		wrErr := conn.WriteMessage(websocket.TextMessage, []byte(message))

		if wrErr != nil {
			log.Printf("An error occurred while opening websocket: %s", wrErr.Error())
			return
		}
	}
}
