.PHONY: build run up down

all: build run

build:
	docker build -t miniapps-builder .

run:
	docker run -it --name Mini-App-Builder -p 4200:4200 -p 4201:4201 miniapps-builder

# Docker Compose
up:
	docker compose up --build -d

down:
	docker compose down
