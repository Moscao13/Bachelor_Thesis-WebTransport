# Go WebTransport test

In order to use this client-server implementation It is necessary to generate a self signed certificate file and a key file for tls handshake interation.
After the generation copy and paste the two file generated (cert.pem and key.pem) on the server folder; then copy and paste certificate fle (cert.pem) in client folder too.

It is possible to generate certificate and key with the openssl command:

    openssl req -new -x509 -nodes \
    -out cert.pem \
    -keyout key.pem \
    -newkey ec \
    -pkeyopt ec_paramgen_curve:prime256v1 \
    -subj '/CN=127.0.0.1' \
    -days 14
