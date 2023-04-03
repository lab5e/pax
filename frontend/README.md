# PAX Frontend

## Create the docker image

Rather than installing Node, npm, Angular and all the dependencies you can run everything via a docker
image.

Use the `ngwrap.sh` script to run a docker container without installing every required component.


## Build a new version

run `bash ngwrap.sh install` then `bash ngwrap.sh run build`. This is equivalent to running `ng build` if you have all the bells and whistles installed.

## Run a dev server

run `make ng-serve`. This is equivalent to running `ng serve` if you have all the bells and whistles installed.

## Host field

The API host is set in the src/environments types. The `.prod.ts` file is used for the prod build and the unadorned type is used for the development server. 

----
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
