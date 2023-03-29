VERSION=0.1.2

all: gen test lint vet build

build: pax

pax:
	@cd cmd/$@ && go build -o ../../bin/$@

lint:
	@revive ./...

vet:
	@go vet ./...

test:
	@go test ./...

gen:
	@buf generate

count:
	@gocloc --not-match-d pkg/pax .

clean:
	@rm -rf bin pkg/pax doc/swagger

docker-image: gen test
	@echo "Cross compiling"
	@cd cmd/pax && GOOS=linux GOARCH=amd64 go build -o ../../bin/pax-linux --trimpath -tags osusergo,netgo -ldflags="-s -w"
	@docker build -t pax . && \
		docker tag pax:latest ghcr.io/lab5e/pax:$(VERSION)
		docker tag pax:latest ghcr.io/lab5e/pax:latest

docker-push:
	@echo "Pushing new docker image"
	@docker push ghcr.io/lab5e/pax:$(VERSION)
	@docker push ghcr.io/lab5e/pax:latest
