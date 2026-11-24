@echo off
title JanSeva AI Launcher
echo ========================================================
echo          STARTING JANSEVA AI FULL-STACK APPLICATION
echo ========================================================
echo.

set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "MAVEN_HOME=C:\Program Files\Apache\apache-maven-3.10.1"
set "PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%"

echo 1. Starting Python FastAPI ML Microservice on Port 8001...
if exist ".venv\Scripts\python.exe" (
    start "JanSeva ML Service (Port 8001)" cmd /k "cd backend-java\python-ml-service && ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001"
) else (
    start "JanSeva ML Service (Port 8001)" cmd /k "cd backend-java\python-ml-service && python -m uvicorn app.main:app --port 8001"
)

ping 127.0.0.1 -n 3 >nul

echo 2. Starting Java Spring Boot Backend on Port 8080...
start "JanSeva Java Backend (Port 8080)" cmd /k "cd backend-java && mvn spring-boot:run"

ping 127.0.0.1 -n 4 >nul

echo 3. Starting React Frontend on Port 3000...
start "JanSeva React Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  All 3 services are launching in their own windows!
echo  Frontend will be live at: http://localhost:3000
echo ========================================================
exit /b 0
