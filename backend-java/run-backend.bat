@echo off
title JanSeva Java Spring Boot Backend
echo ========================================================
echo          STARTING JANSEVA JAVA BACKEND (PORT 8080)
echo ========================================================
echo.

set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "MAVEN_HOME=C:\Program Files\Apache\apache-maven-3.10.1"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

cd /d "%~dp0"
mvn spring-boot:run
pause
