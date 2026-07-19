# Multi-stage Dockerfile
# Stage 1: Build the Maven parent and all child modules
FROM maven:3.9.8-eclipse-temurin-17 AS builder
WORKDIR /build

# Copy full source and build the package
COPY . .
RUN mvn package -DskipTests

# Stage 2: Run the Spring Boot application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Accept module argument (api-gateway, solver-worker, scraper-service)
ARG MODULE=api-gateway
ENV MODULE_NAME=${MODULE}

# Copy the built JAR from the builder stage
COPY --from=builder /build/${MODULE_NAME}/target/*.jar app.jar

# Dynamic environment variable for mapping ports if needed
ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["java", "-jar", "app.jar"]
