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
            '37:64:64:E0:23:BB:67:57:EB:61:79:F6:47:02:4D:E9:D0:A9:D7:04:F5:72:AE:27:16:28:79:7F:01:3D:58:6F'
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