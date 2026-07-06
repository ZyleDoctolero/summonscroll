# pgAdmin Setup Guide for SummonScroll

This guide will walk you through setting up PostgreSQL and pgAdmin for local development of SummonScroll.

## Prerequisites

- PostgreSQL 18 installed on your system
- pgAdmin 4 installed (download from https://www.pgadmin.org/download/)

## Step 1: Start PostgreSQL Server

Ensure your PostgreSQL server is running on `localhost:5432`.

### Windows
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start the service if not running
Start-Service -Name postgresql-x64-18
```

### macOS/Linux
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@18

# Start PostgreSQL (Linux with systemd)
sudo systemctl start postgresql
```

## Step 2: Create Database User

Open a terminal and connect to PostgreSQL as the superuser:

```bash
# Windows
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

Create the `shirooalister` user with a password:

```sql
-- Create user
CREATE USER shirooalister WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
ALTER USER shirooalister CREATEDB;
ALTER USER shirooalister WITH SUPERUSER;

-- Verify user was created
\du
```

Exit psql:
```sql
\q
```

## Step 3: Create Database

Create the SummonScroll database:

```bash
# Connect as the new user
psql -U shirooalister -d postgres

# Create database
CREATE DATABASE summonscroll;

# Connect to the new database
\c summonscroll

# Verify connection
SELECT current_database();

# Exit
\q
```

## Step 4: Configure pgAdmin

### 4.1 Launch pgAdmin

Open pgAdmin 4 from your applications menu.

### 4.2 Add New Server

1. Right-click on "Servers" in the left sidebar
2. Select "Register" → "Server..."

### 4.3 General Tab

- **Name:** SummonScroll Local
- **Server group:** Servers (default)
- **Comments:** Local development database for SummonScroll

### 4.4 Connection Tab

Fill in the following details:

- **Host name/address:** `localhost`
- **Port:** `5432`
- **Maintenance database:** `postgres`
- **Username:** `shirooalister`
- **Password:** `your_secure_password_here`
- **Save password:** ✓ (check this box for convenience)

### 4.5 Advanced Tab (Optional)

- **DB restriction:** `summonscroll` (to only show the SummonScroll database)

### 4.6 Save

Click "Save" to add the server connection.

## Step 5: Verify Connection

1. Expand "Servers" → "SummonScroll Local" in the left sidebar
2. Expand "Databases" → "summonscroll"
3. You should see:
   - Schemas
   - Tables (empty initially)
   - Views
   - Functions
   - etc.

## Step 6: Configure Environment Variables

Update your `.env` file in the `SummonScroll/server` directory:

```env
DATABASE_URL="postgresql://shirooalister:your_secure_password_here@localhost:5432/summonscroll"
```

## Step 7: Run Prisma Migrations

Navigate to the server directory and run migrations:

```bash
cd SummonScroll/server

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (production seed - no demo users)
npx prisma db seed

# OR seed with demo data for development
npm run seed:demo
```

## Step 8: Verify Database Schema

In pgAdmin:

1. Navigate to "Servers" → "SummonScroll Local" → "Databases" → "summonscroll" → "Schemas" → "public" → "Tables"
2. You should see all the tables:
   - User
   - Monster
   - UserMonster
   - Banner
   - PityState
   - CurrencyIcon
   - Guild
   - Battle
   - Habit
   - Achievement
   - And more...

3. Right-click on any table and select "View/Edit Data" → "All Rows" to inspect the data

## Step 9: Connection Pooling Configuration

For production, configure connection pooling in your `DATABASE_URL`:

```env
# Development (no pooling needed)
DATABASE_URL="postgresql://shirooalister:password@localhost:5432/summonscroll"

# Production (with connection pooling)
DATABASE_URL="postgresql://shirooalister:password@localhost:5432/summonscroll?connection_limit=10&pool_timeout=10"
```

### Recommended Pool Settings

- **connection_limit:** 10-20 for small apps, 50-100 for larger apps
- **pool_timeout:** 10 seconds
- **connect_timeout:** 5 seconds

## Troubleshooting

### Cannot connect to PostgreSQL

**Error:** `FATAL: password authentication failed for user "shirooalister"`

**Solution:**
1. Verify the password is correct
2. Check `pg_hba.conf` file (usually in PostgreSQL data directory)
3. Ensure the authentication method is set to `md5` or `scram-sha-256`:
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   host    all             all             127.0.0.1/32            md5
   ```
4. Restart PostgreSQL after changing `pg_hba.conf`

### Port 5432 already in use

**Solution:**
1. Check if another PostgreSQL instance is running
2. Change the port in PostgreSQL configuration
3. Update your `DATABASE_URL` accordingly

### Prisma migration fails

**Error:** `P1001: Can't reach database server`

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check firewall settings
3. Verify `DATABASE_URL` is correct
4. Test connection: `psql -U shirooalister -d summonscroll`

### Permission denied errors

**Solution:**
```sql
-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE summonscroll TO shirooalister;

-- Grant all privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO shirooalister;

-- Grant all privileges on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shirooalister;

-- Grant all privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shirooalister;
```

## Useful pgAdmin Features

### Query Tool

1. Right-click on "summonscroll" database
2. Select "Query Tool"
3. Write and execute SQL queries

Example queries:
```sql
-- Count all users
SELECT COUNT(*) FROM "User";

-- View all active banners
SELECT * FROM "Banner" WHERE "isActive" = true;

-- Check currency icons
SELECT * FROM "CurrencyIcon";

-- View user monsters
SELECT u.username, m.name, um."awakeningStage"
FROM "UserMonster" um
JOIN "User" u ON um."userId" = u.id
JOIN "Monster" m ON um."monsterId" = m.id
LIMIT 10;
```

### Backup Database

1. Right-click on "summonscroll" database
2. Select "Backup..."
3. Choose format (Custom recommended)
4. Select filename and location
5. Click "Backup"

### Restore Database

1. Right-click on "summonscroll" database
2. Select "Restore..."
3. Select backup file
4. Click "Restore"

### View Table Relationships

1. Right-click on "summonscroll" database
2. Select "ERD For Database"
3. View the entity-relationship diagram

## Next Steps

- [Environment Configuration Guide](../README.md)
- [API Documentation](http://localhost:3000/api-docs) (when server is running)
- [Deployment Guide](./DEPLOYMENT.md)

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
