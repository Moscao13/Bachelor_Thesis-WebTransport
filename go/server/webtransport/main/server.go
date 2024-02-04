// create a new webtransport.Server, listening on (UDP) port 443
package main

import (
	"log"
	"net/http"

	"webtransport/server/test"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func main() {

	certFile := "./cert.pem"
	keyFile := "./key.pem"

	/// Setting WebTransport server
	s := webtransport.Server{
		H3: http3.Server{Addr: ":443"},
	}

	/// Creating endpoints for http3 server
	http.HandleFunc("/webtransport/tests/singlestream/singleclient", func(w http.ResponseWriter, r *http.Request) {
		conn, upErr := s.Upgrade(w, r)
		if upErr != nil {
			log.Printf("upgrading failed: %s", upErr)
			w.WriteHeader(400)
			return
		}

		test.TestSingleStreamSingleClient(w, r, conn)

	})

	http.HandleFunc("/webtransport/tests/multistream/singleclient", func(w http.ResponseWriter, r *http.Request) {
		conn, upErr := s.Upgrade(w, r)
		if upErr != nil {
			log.Printf("upgrading failed: %s", upErr)
			w.WriteHeader(400)
			return
		}

		test.TestMultiStreamSingleClient(w, r, conn)

	})

	/// Starting up server
	if err := s.ListenAndServeTLS(certFile, keyFile); err != nil {
		log.Printf("An error occurred while listening for a connection: %s\nShutting down...", err)
	}

}
