  let transport;

  const messageToServer = document.getElementById("messageToServer")
  const connectionStatusString = document.getElementById("connectionStatus")
  const errorBox = document.getElementById("errors")
  const serverResponseBox = document.getElementById("messageFromServer")

  function load(){
    connectionStatusString.innerHTML = 'Not connected'
    connectionStatusString.style.color = 'red'
  }

  function connect(){

    const args = { hostname: '127.0.0.1', port: 8080 }
    const hashes = {
      serverCertificateHashes: [
        {
          algorithm: 'sha-256',
          value:
            'A0:A7:37:76:34:4A:D0:06:EA:4B:3B:07:1B:28:0A:32:C2:1E:22:B1:15:57:30:4E:BB:A1:39:5C:5C:F1:C4:BF'
        }
      ]
    }


    const url = 'https://' + args.hostname + ':' + args.port + '/echo'
    console.log('Starting connection...')
    const hashargs = {
      ...hashes,
      serverCertificateHashes: hashes.serverCertificateHashes.map((el) => ({
        algorithm: el.algorithm,
        value: buffer.Buffer.from(el.value.split(':').map((el) => parseInt(el, 16)))
      }))
    }
    transport = new WebTransport(url, hashargs)
    const waitForClosure = async () => {
      await transport.closed
      console.log("Connection closed")
      connectionStatusString.innerHTML = 'Not connected'
      connectionStatusString.style.color = 'red'
    }

    waitForClosure()
  
    transport.ready.then(() => {
      console.log('WebTransport connection is ready')
      connectionStatusString.innerHTML = 'Connected'
      connectionStatusString.style.color = 'green'
    }).catch((err) => {
      console.error(`An error occurred while connecting to server: ${err}`)
      errorBox.value += `An error occurred while connecting to server: ${err}\n`
    })
    
  }

  function disconnect(){
    closeConnection(transport)
    connectionStatusString.innerHTML = 'Not connected'
    connectionStatusString.style.color = 'red'
    clearMessage()
  }


  function sendToServer(){
    const data = messageToServer.value
    if(data == null || data == ''){
      errorBox.value += 'Message cannot be null'
      return
    }
    
    if(connectionStatusString.innerHTML == 'Not connected'){
      errorBox.value += 'Cannot send data because no connection were open\n'
      return
    }   
    
    transport.createBidirectionalStream().then(async (value) => {
      await writeOnOutgoingStream(value.writable, data)
      const resp = new TextDecoder().decode(await readData(value.readable))
      console.log(resp)
      serverResponseBox.value = resp
      clearMessage()
    }).catch((err) => {
      console.error(`An error occurred while writing data to server: ${err}`)
      errorBox.value += `An error occurred while writing data to server: ${err}\n`
    })
  }

  function clearMessage(){
    messageToServer.value = ''
  }

  function clearErrors(){
    errorBox.value = ''
  }