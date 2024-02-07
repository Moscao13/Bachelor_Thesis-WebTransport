# Go WebTransport test

In order to try this client-server implementation You have to generate a self signed certificate file and a private key file for tls handshake interation.
The openssl command below generates the two files cert.pem and key.pem

    openssl req -new -x509 -nodes \
    -out cert.pem \
    -keyout key.pem \
    -newkey ec \
    -pkeyopt ec_paramgen_curve:prime256v1 \
    -subj '/CN=127.0.0.1' \
    -days 14

Both files has to be placed in the same folder of the server.go file. Only certificate file has to be placed also in the same folder of the client.go file.

"-days 14" flag indicates that generated certificate, with the relative private key, will expires in 14 days. So remember to generate another certificate after the expiration.
