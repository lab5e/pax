VERSION=0.1.7
all: gen test lint vet build

build: pax

pax:
	@cd cmd/$@ && go build -o ../../bin/$@

ang:
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
		docker tag pax:latest borud/pax:$(VERSION)
		docker tag pax:latest borud/pax:latest

docker-push:
	@echo "Pushing new docker image"
	@docker push borud/pax:$(VERSION)
	@docker push borud/pax:latest


SPEC:=$(PWD)/doc/swagger/pax/v1
GEN:=$(PWD)/frontend/src/app/api/pax
openapi-client:
	@mkdir -p $(GEN)/model/
	@rm -f $(GEN)/model/*.ts
	@docker run --platform linux/arm64 \
		-v$(GEN):/gen \
		-v$(SPEC):/spec \
		-it openapitools/openapi-generator-cli:v6.2.1 generate \
		--git-user-id=lab5e \
		--git-repo-id=pax-client  \
		--package-name pax-client \
		-g typescript-angular -i /spec/service.swagger.json -o /gen
	@rm -fR $(GEN)/.openapi-generator
	@rm -fR $(GEN)/*.sh
	@rm -fR $(GEN)/.gitignore
	@rm -fR $(GEN)/README.md
	@rm -fR $(GEN)/.openapi-generator-ignore


