# UDPT Employee Management - developer commands.
# Run `make` (or `make help`) to list every target.

SHELL       := /bin/bash
.DEFAULT_GOAL := help

SERVER_DIR  := server
CLIENT_DIR  := client
COMPOSE     := docker compose
MVNW        := ./mvnw -B

# The backend targets Java 21. On macOS, prefer an installed JDK 21 even when a newer JDK is
# the default (override with `make <target> JAVA_HOME=/path/to/jdk`).
ifeq ($(shell uname -s),Darwin)
  JDK21 := $(shell /usr/libexec/java_home -v 21 --failfast 2>/dev/null)
  ifneq ($(JDK21),)
    export JAVA_HOME := $(JDK21)
  endif
endif

# Values from .env are also exported to services started with `make run-<service>`.
ifneq ($(wildcard .env),)
  include .env
  export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

.PHONY: help env up down logs ps smoke clean-data infra dev-client install \
        build build-server build-client test test-server test-client clean

##@ Run the whole stack in Docker

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n"} \
		/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } \
		/^[a-zA-Z0-9_%-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(firstword $(MAKEFILE_LIST))

env: ## Create .env from .env.example if it does not exist
	@test -f .env || { cp .env.example .env && echo "Created .env from .env.example"; }

up: env ## Build and start everything, then wait until all services are healthy
	$(COMPOSE) up -d --build --wait --wait-timeout 300
	@echo ""
	@echo "  Web app      http://localhost:3000"
	@echo "  API gateway  http://localhost:8080"
	@echo "  Eureka       http://localhost:8761"
	@echo "  RabbitMQ     http://localhost:15672  (guest / guest)"
	@echo ""
	@echo "  Log in as admin / admin123 (Manager) or employee / employee123 (Employee)"

down: ## Stop the stack (data is kept)
	$(COMPOSE) down

logs: ## Follow logs: all services, or one with SERVICE=user-service
	$(COMPOSE) logs -f --tail=100 $(SERVICE)

ps: ## Show container status and health
	$(COMPOSE) ps

smoke: ## End-to-end API smoke test against the running stack
	./scripts/smoke-test.sh $(GATEWAY_URL)

clean-data: ## Stop the stack and DELETE its databases (fresh demo data on next `make up`)
	$(COMPOSE) down -v

##@ Local development (services on the host, infrastructure in Docker)

infra: ## Start only MySQL, MongoDB and RabbitMQ
	$(COMPOSE) up -d --wait mysql mongo rabbitmq

run-%: ## Run one backend service with Maven, e.g. `make run-user-service` (one terminal each)
	cd $(SERVER_DIR) && $(MVNW) -pl $* spring-boot:run

dev-client: $(CLIENT_DIR)/node_modules ## Start the React dev server on http://localhost:3000
	cd $(CLIENT_DIR) && npm start

##@ Build and test

install: ## Install client dependencies from the lockfile
	cd $(CLIENT_DIR) && npm ci --no-audit --no-fund

build: build-server build-client ## Build backend jars and the production client bundle

build-server: ## Package all backend services (tests skipped)
	cd $(SERVER_DIR) && $(MVNW) -DskipTests package

build-client: $(CLIENT_DIR)/node_modules ## Production build of the React app
	cd $(CLIENT_DIR) && npm run build

test: test-server test-client ## Run all checks (same as CI)

test-server: ## Backend unit + integration tests (the Testcontainers test needs Docker)
	cd $(SERVER_DIR) && $(MVNW) verify

test-client: $(CLIENT_DIR)/node_modules ## Lint and build the client in CI mode (warnings fail)
	cd $(CLIENT_DIR) && CI=true npm run build

clean: ## Remove build outputs
	cd $(SERVER_DIR) && $(MVNW) -q clean
	rm -rf $(CLIENT_DIR)/build

# Reinstall client dependencies when the lockfile changes.
$(CLIENT_DIR)/node_modules: $(CLIENT_DIR)/package-lock.json
	cd $(CLIENT_DIR) && npm ci --no-audit --no-fund
	@touch $@
