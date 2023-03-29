FROM alpine

WORKDIR /pax
COPY bin/pax-linux /bin/pax
CMD /bin/pax server --db /pax/data/pax.db