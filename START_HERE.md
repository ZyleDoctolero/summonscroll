# 🎮 SummonScroll - Quick Start Guide

## 🚀 Starting the Application

### Option 1: Start Everything at Once (Recommended)
Double-click or run:
```powershell
.\start-all.ps1
```

This will:
1. ✅ Start PostgreSQL database
2. ✅ Start Backend server (port 3001)
3. ✅ Start Frontend (port 5173 or 5174)

### Option 2: Start Services Manually

#### 1. Start PostgreSQL
```powershell
.\start-postgres.ps1
```
Or manually:
```powershell
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" start
```

#### 2. Start Backend
```powershell
cd server
npm run dev
```

#### 3. Start Frontend
```powershell
npm run dev
```

---

## 🔐 Login Credentials

### Demo Account (Pre-loaded with data)
- **Email**: `crimsonblade@summonscroll.dev`
- **Password**: `CrimsonBlade123!`
- **Level**: 42
- **Resources**: 12,450 Spirit Crystals, 234 Void Shards, 3 Pact Seals
- **Monsters**: 7 pre-collected monsters

### Create Your Own Account
Navigate to: `http://localhost:5173/auth/register`

---

## 🌐 Access URLs

- **Frontend**: http://localhost:5173 (or 5174 if 5173 is in use)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Metrics**: http://localhost:3001/metrics

---

## 🎯 Features to Try

### 1. **The Altar** (⛩ Gacha System)
- 4 active banners available
- Pull monsters using Spirit Crystals or Void Shards
- Pity system ensures rare drops

### 2. **Directives** (🔥 Habit Tracking)
- Create daily habits
- Complete them to earn Spirit Crystals and XP
- Build streaks for bonus rewards

### 3. **Compendium** (📖 Monster Collection)
- View all collected monsters
- Check monster stats and skills
- Track your collection progress

### 4. **Guild** (⚔️ Social Features)
- Join "Spectral Vanguard" guild
- Participate in guild raids
- Collaborate with other summoners

### 5. **Battles** (⚔️ Combat)
- Test your monsters in battle
- Earn rewards and XP
- Unlock new content

---

## 🛠️ Troubleshooting

### Problem: "Altar is empty" or "Login fails"
**Solution**: PostgreSQL is not running
```powershell
.\start-postgres.ps1
```

### Problem: "Port 5173 is in use"
**Solution**: Frontend will automatically use port 5174
- Just navigate to http://localhost:5174 instead

### Problem: "CORS error" or "Network error"
**Solution**: Backend is not running
```powershell
cd server
npm run dev
```

### Problem: "Database connection refused"
**Solution**: 
1. Check if PostgreSQL is running:
   ```powershell
   psql -U shirooalister -d summonscroll -c "SELECT 1;"
   ```
2. If not, start it:
   ```powershell
   .\start-postgres.ps1
   ```

---

## 🔄 Stopping Services

### Stop PostgreSQL
```powershell
.\stop-postgres.ps1
```
Or manually:
```powershell
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" stop
```

### Stop Backend/Frontend
Just close the terminal windows or press `Ctrl+C`

---

## 📊 Database Management

### View Database in GUI
```powershell
cd server
npm run db:studio
```
This opens Prisma Studio at http://localhost:5555

### Reset Database (⚠️ Deletes all data)
```powershell
cd server
npm run db:reset
```

### Re-seed Database
```powershell
cd server
npm run db:seed
```

---

## 🎮 Game Mechanics

### Currency System
- **Spirit Crystals**: Main currency for standard/featured banners (160 per pull)
- **Void Shards**: Currency for streak banners (1 per pull)
- **Pact Seals**: Premium currency for exclusive EX monster banners

### Monster Rarity
- Common → Uncommon → Rare → Elite → Epic → Legendary → Mythic → **EX**
- EX monsters are the rarest and most powerful

### Progression
1. Complete habits in **Directives** to earn Spirit Crystals
2. Use crystals at **The Altar** to summon monsters
3. Build your team in **Compendium**
4. Battle in **Battles** to earn more rewards
5. Join a **Guild** for collaborative content

---

## 📝 Quick Commands Reference

```powershell
# Start everything
.\start-all.ps1

# Start PostgreSQL only
.\start-postgres.ps1

# Stop PostgreSQL
.\stop-postgres.ps1

# Backend commands (in server/ directory)
npm run dev          # Start development server
npm run build        # Build for production
npm run db:studio    # Open database GUI
npm run db:seed      # Seed database with demo data

# Frontend commands (in root directory)
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality
```

---

## 🆘 Need Help?

1. Check the logs in the terminal windows
2. Verify all services are running:
   - PostgreSQL: `psql -U shirooalister -d summonscroll -c "SELECT 1;"`
   - Backend: Visit http://localhost:3001/health
   - Frontend: Visit http://localhost:5173

3. Restart everything:
   ```powershell
   # Stop PostgreSQL
   .\stop-postgres.ps1
   
   # Close backend and frontend terminals
   
   # Start everything again
   .\start-all.ps1
   ```

---

## 🎉 Enjoy SummonScroll!

Your habits. Your monsters. Your legend.
