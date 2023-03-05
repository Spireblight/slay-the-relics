## Build
FROM golang:1.20-bullseye AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . ./

RUN go build -o /slay-the-relics

## Deploy
FROM golang:1.20-bullseye

RUN adduser appuser
USER appuser

WORKDIR /

COPY --from=build /slay-the-relics /slay-the-relics

EXPOSE 8080

ENTRYPOINT ["/slay-the-relics"]