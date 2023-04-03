#!/bin/bash
# Wrapper shell for node/angular
case $1 in 
    serve)
        docker run -w /src -p "4200:4200/tcp" -it -v $(PWD):/src node:18-alpine  /usr/local/bin/npm run start -- --host=0.0.0.0 --public-host
        ;;
    *)
        docker run -w /src -it -v $(PWD):/src node:18-alpine  /usr/local/bin/npm $1 $2 $3
        ;;
esac        
