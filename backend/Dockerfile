# Build Stage: Compile the Gradle application using JDK 21
FROM gradle:8.10-jdk21-alpine AS build
WORKDIR /home/gradle/src
COPY --chown=gradle:gradle . .
RUN ./gradlew build -x test --no-daemon

# Run Stage: Deploy the compiled JAR using a lightweight JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /home/gradle/src/build/libs/platform-0.0.1-SNAPSHOT.jar app.jar

# Spring Boot default port
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
