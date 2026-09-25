# ---- Build stage ----
FROM maven:3.9.10-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw mvnw.cmd ./
RUN mvn -B -q dependency:go-offline

# Build the application
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render provides the PORT env var
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
