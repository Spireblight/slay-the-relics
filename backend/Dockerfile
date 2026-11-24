FROM golang:1.27-trixie AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . ./

RUN go build -o /slay-the-relics

FROM golang:1.27-trixie

RUN adduser appuser
USER appuser

WORKDIR /

COPY --from=build /slay-the-relics /slay-the-relics

EXPOSE 8080

ENTRYPOINT ["/slay-the-relics"]
