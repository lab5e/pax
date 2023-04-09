FROM alpine

WORKDIR /pax
COPY bin/pax-linux /bin/pax
CMD /bin/pax server --server-url https://pax.lab5e.com --fetch-on-new --db /pax/data/pax.db