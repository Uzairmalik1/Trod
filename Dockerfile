# Stage 1: Combined Node.js and Python environment
FROM node:20-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip3 install --upgrade pip setuptools wheel

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy Python requirements and install them
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python3 -m nltk.downloader punkt punkt_tab

# Copy application code
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Create uploads directory and set permissions
RUN mkdir -p public/uploads && \
    chmod -R 777 public/uploads

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Waiting for PostgreSQL to start..."\n\
while ! pg_isready -h db -U postgres -q; do\n\
  echo "Waiting for database connection..."\n\
  sleep 2\n\
done\n\
echo "Database is up!"\n\
\n\
# Run migrations\n\
echo "Running migrations..."\n\
npx prisma migrate deploy\n\
\n\
# Start the application\n\
echo "Starting application..."\n\
npm run start\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["/app/start.sh"] 