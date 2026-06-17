FROM python:3.11-slim

# Install ffmpeg for Whisper
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Command to run the backend
CMD ["uvicorn", "dora_foodCultural_backend:app", "--host", "0.0.0.0", "--port", "8000"]
