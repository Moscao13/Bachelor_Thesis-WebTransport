package test

import (
	"bufio"
	"context"
	"io"
	"log"
	"net/http"
	"sync"

	"github.com/quic-go/webtransport-go"
)

var streamQty int = 100
var processQty int = 50

func TestSingleStreamSingleClient(w http.ResponseWriter, r *http.Request, conn *webtransport.Session) {
	var wg sync.WaitGroup

	/// Accepting Bidirectional stream opened by client
	bistream, biErr := conn.AcceptStream(context.Background())

	if biErr != nil {
		log.Printf("An error occurred while opening bidirectional stream: %s", biErr.Error())
		return
	}

	reader := bufio.NewReader(bistream)

	for i := 0; i < streamQty; i++ {

		/// Reading request message from client
		message, rdErr := reader.ReadBytes('w')

		if rdErr != nil && rdErr == io.EOF {
			break
		} else if rdErr != nil {
			log.Printf("An error occurred while reading from bidirectional stream: %s", rdErr.Error())
			return
		}

		/// Writing response message to client
		bistream.Write(message)
	}
	bistream.Close()
	wg.Wait()
}

/*---------------------------------------------------------------------------------------------------------------------------------------------*/

func multiStreamThread(stream webtransport.Stream, wg *sync.WaitGroup) {
	defer wg.Done()

	reader := bufio.NewReader(stream)

	for i := 0; i < streamQty; i++ {
		/// Reading request message from client
		message, rdErr := reader.ReadBytes('w')

		if rdErr != nil && rdErr == io.EOF {
			break
		} else if rdErr != nil {
			log.Printf("An error occurred while reading from bidirectional stream: %s", rdErr.Error())
			return
		}

		/// Writing response message to client
		stream.Write(message)
	}
	stream.Close()
}

func TestMultiStreamSingleClient(w http.ResponseWriter, r *http.Request, conn *webtransport.Session) {

	var wg sync.WaitGroup

	wg.Add(processQty)
	for i := 0; i < processQty; i++ {

		/// Accepting bidirectional stream opened by the client
		bistream, biErr := conn.AcceptStream(context.Background())

		if biErr != nil {
			log.Printf("An error occurred while opening bidirectional stream: %s", biErr.Error())
			continue
		}

		go multiStreamThread(bistream, &wg)
	}

	wg.Wait()
}

/*---------------------------------------------------------------------------------------------------------------------------------------------*/
