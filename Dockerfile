FROM python:3.13.4-slim

# Install system dependencies
RUN apt-get update && apt-get install -y     build-essential     libpq-dev     && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy frontend and build it
COPY frontend/ ./frontend/
RUN cd frontend &&     npm install -g pnpm@8.15.8 &&     pnpm install --no-frozen-lockfile &&     pnpm run build

# Copy backend
COPY backend/ ./backend/
COPY *.py ./

# Create static directory and copy frontend build
RUN mkdir -p static
RUN cp -r frontend/build/* static/

# Expose port
EXPOSE 8000

# Start command
CMD [uvicorn, backend.main:app, --host, 0.0.0.0, --port, 8000]
