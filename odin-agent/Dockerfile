# Use the official lightweight Python image.
FROM python:3.13-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Set the working directory in the container
ENV APP_HOME /app
WORKDIR $APP_HOME

# WeasyPrint (carousel PDF + poster rendering) loads native Pango/Cairo/GObject
# libraries at runtime via ctypes. The slim image ships without them, which fails
# with "cannot load library 'libgobject-2.0-0'". Install the full stack here.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the container
COPY . ./

# Ensure runtime directories exist (Cloud Run fs is ephemeral but writable)
RUN mkdir -p hitl_inbox logs output traces

# Expose the port that Cloud Run will use
EXPOSE 8080

# Run the FastAPI service on container startup using uvicorn.
# Cloud Run automatically sets the PORT environment variable (default 8080)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
