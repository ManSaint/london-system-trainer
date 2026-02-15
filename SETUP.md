# Setup Guide - London System Trainer

## 🚀 Quick Start

### 1. Open in VS Code

You're already here! The project is at: `~/london-system-trainer`

### 2. Test the APIs (No Setup Required!)

```bash
node test-apis.js
```

This will verify:
- ✅ Lichess API is working (free, no key needed)
- ✅ Chess-API is accessible (100 free requests/day)

### 3. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Or npm:
```bash
npm install
```

### 4. Start Development

```bash
bun dev
```

Open http://localhost:3000

## 🔧 Understanding the APIs

### Lichess API (Completely Free!)

**What it does:**
- Fetches real master games
- Provides opening statistics
- Shows popular continuations

**No API key needed!** Just use it:

```bash
curl "https://explorer.lichess.ovh/masters?play=d2d4,g8f6,c1f4&topGames=3"
```

### Chess-API.com (Stockfish 17)

**Free tier:** 100 requests/day
- Position evaluation
- Best move suggestions
- Move validation

**Optional:** Get API key at https://chess-api.com/

## 📚 How to Use the APIs

### Fetching Real Master Games

```typescript
import { fetchLondonVsKID } from '@/lib/api/lichess';

const data = await fetchLondonVsKID();
console.log(`Found ${data.topGames.length} games`);
```

### Analyzing Positions

```typescript
import { analyzePosition } from '@/lib/api/stockfish';

const analysis = await analyzePosition(fen, 15);
console.log('Best move:', analysis.bestMove);
```

## 🎓 Creating Verified Lessons

### ❌ Old Way (Wrong!)

```typescript
// Making up moves = tactical errors!
const badLesson = {
  whiteMove: "d1h5", // Loses queen!
  explanation: "Win material"
};
```

### ✅ New Way (Correct!)

```typescript
import { getMostPopularMove } from '@/lib/api/lichess';

// 1. Get what masters actually play
const nextMove = await getMostPopularMove(['d2d4', 'g8f6']);

// 2. Use verified move in lesson
const goodLesson = {
  whiteMove: nextMove.uci,
  explanation: `Masters play ${nextMove.san} (${nextMove.winRate}% win rate)`,
  verified: true ✅
};
```

## 📁 Project Structure

```
london-system-trainer/
├── lib/
│   └── api/
│       ├── lichess.ts      # Master games ⭐
│       └── stockfish.ts    # Analysis ⭐
├── package.json
├── tsconfig.json
├── test-apis.js            # Test script ⭐
└── README.md
```

## 🆘 Troubleshooting

### "Cannot find module"
```bash
bun install
```

### "API not responding"
```bash
node test-apis.js  # Test connectivity
```

### "Rate limit exceeded"
- Chess-API: 100/day limit
- Lichess: No limits! Use freely

## ✅ You're Ready!

1. ✅ Project created in ~/london-system-trainer
2. ✅ APIs integrated (Lichess + Stockfish)
3. ✅ VS Code configured
4. ✅ Test script ready

**Next: Run `node test-apis.js` to verify everything works!** 🚀
