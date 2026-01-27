# MongoDB Setup Guide

## ✅ What's Been Done

I've set up the MongoDB foundation for you:

1. ✅ Created MongoDB connection utility (`lib/mongodb/connection.ts`)
2. ✅ Created User model with country field (`lib/mongodb/models/User.ts`)
3. ✅ Created TypeScript types (`types/database.ts`)
4. ✅ Created error handling utilities (`lib/mongodb/utils/errors.ts`)
5. ✅ Created environment variables template (`.env.local.example`)

## 📋 What You Need to Do

### Step 1: Install Dependencies

Due to a pnpm store issue, please run these commands manually in your terminal:

```bash
cd "C:\Users\ACcidBuRN\Desktop\nextjs template\courses-test"
pnpm add mongoose
pnpm add -D @types/mongoose
```

**OR** if pnpm still has issues, try:

```bash
pnpm install
pnpm add mongoose @types/mongoose
```

### Step 2: Set Up MongoDB Atlas (Free Tier)

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Choose the **FREE M0 cluster** (512 MB storage)

2. **Create a Cluster**
   - Choose a cloud provider (AWS recommended)
   - Choose a region closest to you
   - Name your cluster (e.g., "courses-cluster")
   - Click "Create Cluster"

3. **Set Up Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (SAVE THESE!)
   - Set privileges to "Atlas Admin" (for development)
   - Click "Add User"

4. **Set Up Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your current IP address
   - Click "Confirm"

5. **Get Your Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
   - **Replace `<password>` with your actual password**
   - **Replace `<database-name>` with `courses-app`** (or your preferred name)

### Step 3: Create Environment File

1. Copy the example file:
   ```bash
   copy .env.local.example .env.local
   ```

2. Open `.env.local` and add your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/courses-app
   ```

3. Generate a NextAuth secret:
   ```bash
   # On Windows PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   
   # Or use an online generator: https://generate-secret.vercel.app/32
   ```

4. Add the secret to `.env.local`:
   ```env
   NEXTAUTH_SECRET=your-generated-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

### Step 4: Test the Connection

I've created a test API route for you. After setting up everything:

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Visit: http://localhost:3000/api/test-db

3. You should see:
   ```json
   {
     "status": "success",
     "message": "MongoDB connected successfully",
     "database": "courses-app"
   }
   ```

## 🎯 Next Steps

Once MongoDB is connected, we can:
1. Create more models (Course, Payment, etc.)
2. Set up authentication (NextAuth.js)
3. Create API routes
4. Build the dashboard

## 🐛 Troubleshooting

### Connection Error?
- Check your MongoDB URI is correct
- Make sure you replaced `<password>` and `<database-name>`
- Verify network access allows your IP
- Check database user has correct permissions

### pnpm Issues?
- Try: `pnpm install` first
- Or use: `npm install mongoose @types/mongoose`
- Or: `yarn add mongoose @types/mongoose`

### Still Having Issues?
Let me know the error message and I'll help you fix it!
