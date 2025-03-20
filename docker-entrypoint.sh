#!/bin/sh
set -e

echo "🔄 Waiting for PostgreSQL to start..."
until pg_isready -h db -p 5432 -U postgres; do
  echo "Waiting for database connection..."
  sleep 2
done

echo "🏁 Database is up - running Prisma migrations"

# Create migration if it doesn't exist
MIGRATION_DIR="/app/prisma/migrations/20250318175217_init"
if [ ! -d "$MIGRATION_DIR" ]; then
  echo "🆕 Creating initial migration..."
  npx prisma migrate dev --name init --create-only
fi

# Run the migration
echo "🚀 Applying migrations..."
npx prisma migrate deploy

# Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "🎬 Starting application"
exec "$@" 