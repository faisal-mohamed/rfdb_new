# Database Migration Instructions

## The Issue
The database schema is not up to date with the new workflow system. You need to run a migration to add the new fields and relationships.

## Steps to Fix

### 1. Generate Migration
```bash
npx prisma migrate dev --name add-workflow-system
```

### 2. If Migration Fails (Schema Drift)
If you get schema drift errors, you have two options:

#### Option A: Reset Database (Recommended for Development)
```bash
# This will delete all data and recreate the database
npx prisma migrate reset
```

#### Option B: Push Schema (Force Update)
```bash
# This will force update the schema without migrations
npx prisma db push
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Seed Database (Optional)
```bash
npx prisma db seed
```

## What the Migration Adds

1. **workflowStatus** field to Document table
2. **DocumentVersion** table for storing V1/V2 JSON data
3. **Proper foreign key relationships**
4. **Indexes for performance**

## After Migration

Once the migration is complete, the document upload should work properly with:
- ✅ Document creation with workflowStatus
- ✅ Proper user relationships
- ✅ Auto V1 generation
- ✅ Full workflow system

## Troubleshooting

If you still get errors after migration:

1. **Check Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Restart Development Server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check Database Connection**:
   Make sure your `DATABASE_URL` in `.env` is correct and the database is running.
