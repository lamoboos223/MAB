.PHONY: build run up down

all: build run

build:
	docker build -t miniapps-builder .

run:
	docker run -it -p 4200:4200 miniapps-builder

# Docker Compose
up:
	docker compose up --build -d

down:
	docker compose down
