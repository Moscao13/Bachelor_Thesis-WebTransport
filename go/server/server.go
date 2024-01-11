// create a new webtransport.Server, listening on (UDP) port 443
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func main() {

	certFile := "./cert.pem"
	keyFile := "./key.pem"

	/// Setting the WebTransport server
	s := webtransport.Server{
		H3: http3.Server{Addr: ":443"},
	}

	/// Creating the endpoints for http3 server
	http.HandleFunc("/webtransport", func(w http.ResponseWriter, r *http.Request) {
		log.Print("I'm inside the method")
		log.Printf("Datagrams enabled before: %t", s.H3.EnableDatagrams)

		conn, upErr := s.Upgrade(w, r)
		log.Printf("Datagrams enabled after: %t", conn.ConnectionState().SupportsDatagrams)
		if upErr != nil {
			log.Printf("upgrading failed: %s", upErr)
			log.Printf("upgrading failed: %s", conn.LocalAddr())
			w.WriteHeader(400)
			return
		}

		/// Trying to open a unidirectional outgoing stream
		snd, uniErr := conn.OpenUniStream()

		if uniErr != nil {
			w.WriteHeader(500)
			log.Println("An error occurred while opening unidirectional outgoing stream")
			return
		}

		w.WriteHeader(205)
		log.Printf("Stream successfully opened with id: %d", snd.StreamID())

		message := "OK"
		snd.Write([]byte(message))

		/// Closing the stream
		log.Printf("Sent to client String: %s! No waiting for response becouse is a unidirectional stream.\nClosing the stream...", message)
		snd.Close()

		/// Accepting bidirectional stream opened by the client
		bistream, biErr := conn.AcceptStream(context.Background())

		if biErr != nil {
			log.Println("An error occurred while opening bidirectional stream")
			return
		}

		log.Println("Bidirectional stream opened")

		/// Reading message from client
		hellofromclient := make([]byte, 13)

		num, rdErr := bistream.Read(hellofromclient)

		if rdErr != nil {
			log.Println("An error occurred while reading from bidirectional stream")
			return
		}

		log.Printf("Read %d bytes from stream!\nReceived string: %s", num, string(hellofromclient))

		/// Writing message to server
		hellofromserver := "Hello client"
		bistream.Write([]byte(hellofromserver))

		log.Printf("Sending to client string: %s", hellofromserver)

		/// Closing client side bidirectional stream
		bistream.Close()
		log.Println("Bidirectional stream closed")

	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Root!!")

		w.WriteHeader(205)

		hello := "Hello there"
		count, _ := w.Write([]byte(hello))
		log.Printf("write count: %d\n", count)

	})

	log.Printf("Server ready to serve to %s at port %d", s.H3.Addr, s.H3.Port)

	if err := s.ListenAndServeTLS(certFile, keyFile); err != nil {
		log.Printf("ciao %s fine", err)
	}

}
