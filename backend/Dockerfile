# backend/Dockerfile

FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY ./backend/package*.json ./backend/
RUN cd backend && npm install

# Copy all backend source files to /app/backend
COPY ./backend ./backend

# Copy frontend views to /app/frontend
COPY ./frontend ./frontend

# Expose app port
EXPOSE 3000

# Start app (assuming index.js is main file in backend/)
CMD ["node", "backend/index.js"]
