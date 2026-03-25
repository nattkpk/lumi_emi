#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting LumiEMI System...${NC}"

# 0. Start Database via Docker
echo -e "${BLUE}Starting PostgreSQL Database...${NC}"
cd backend || exit
docker compose up -d
cd ..

# Wait a moment for DB to become available
sleep 3

# 1. Start Backend Server
echo -e "${BLUE}Starting Node.js Backend...${NC}"
cd backend || exit
npm install
npx nodemon src/index.js &
BACKEND_PID=$!
cd ..

# 2. Wait a moment for backend to initialize
sleep 2

# 3. Start Frontend Dev Server
echo -e "${BLUE}Starting Vue 3 Frontend...${NC}"
cd frontend || exit
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}Both services are running!${NC}"
echo -e "Frontend: http://localhost:5173"
echo -e "Backend API: http://localhost:3001"
echo -e "${RED}Press Ctrl+C to stop both servers.${NC}"

# Function to safely kill both processes on exit
cleanup() {
    echo -e "\n${RED}Stopping all services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Catch Ctrl+C (SIGINT) and kill both child processes
trap cleanup SIGINT SIGTERM

# Wait for processes to finish (which they won't until killed)
wait $BACKEND_PID $FRONTEND_PID
