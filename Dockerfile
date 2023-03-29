FROM alpine

WORKDIR /pax
COPY bin/pax-linux /bin/pax
CMD /bin/pax server --fetch-on-new --db /pax/data/pax.db