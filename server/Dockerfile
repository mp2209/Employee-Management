# syntax=docker/dockerfile:1

# One Dockerfile for every backend module, selected with the MODULE build argument:
#   docker build --build-arg MODULE=user-service -t udpt/user-service server/
# The build stage does not depend on MODULE, so it is built once and shared by all images.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
ARG MODULE
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build /workspace/${MODULE}/target/${MODULE}.jar app.jar
USER app
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
