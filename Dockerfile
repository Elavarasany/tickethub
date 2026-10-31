
FROM eclipse-temurin:27-jdk AS build

WORKDIR /app

COPY booking/.mvn .mvn/
COPY booking/mvnw pom.xml ./

RUN chmod +x mvnw

COPY booking/src ./src

RUN ./mvnw -B clean package -DskipTests

FROM eclipse-temurin:27-jre

WORKDIR /app

COPY --from=build /app/target/booking-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} -jar app.jar"]
