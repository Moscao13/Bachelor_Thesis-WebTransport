# Nodejs WebTransport test

In order to try this client-server implementation You have to generate a self signed certificate file and a private key file for tls handshake interation.
The openssl command below generates the two files cert.pem and key.pem

    openssl req -new -x509 -nodes \
    -out cert.pem \
    -keyout key.pem \
    -newkey ec \
    -pkeyopt ec_paramgen_curve:prime256v1 \
    -subj '/CN=127.0.0.1' \
    -days 14

Those files has to be placed in the same folder of the server.js file.

After it You have to manually place the fingerprint of this certificate in client files (client/client.js and test/client/testWebTransportClient.js).
In those files You will find a label indicating places where fingerprint has to be placed.

"-days 14" flag indicates that generated certificate, with the relative private key, will expires in 14 days. So remember to generate another certificate after the expiration.
