# Use Python slim image for a lightweight environment
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose Flask's default port
EXPOSE 5000

# Start the Flask app
CMD ["python", "app.py"]