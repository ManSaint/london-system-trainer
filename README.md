# London System Trainer

An interactive chess trainer focused on teaching the London System opening against all common Black defenses, with **verified move sequences from master games** and **Stockfish engine analysis**.

## 🎯 Features

- **Multiple Variation Lessons**: Learn vs King's Indian, Queen's Gambit Declined, Queen's Indian, and Dutch Defense
- **Verified Move Sequences**: All lessons based on real master games from Lichess database
- **Stockfish Integration**: Move validation and position evaluation
- **Interactive Board**: Visual arrows, move highlighting, and step-by-step guidance
- **Practice Mode**: Test your skills against AI opponents at different difficulty levels
- **Game Analysis**: Post-game feedback showing your adherence to London System principles

## 🚀 Quick Start

```bash
# Install dependencies (using Bun as you prefer)
bun install

# Or with npm
npm install

# Start development server
bun dev

# Or with npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 API Integration

### 1. Lichess API (Free, No Key Required!)

Get real master games for each variation:

```typescript
const response = await fetch(
  'https://explorer.lichess.ovh/masters?play=d4,Nf6,Bf4,g6&topGames=5'
);
```

### 2. Chess-API.com (Free Stockfish 17)

Move validation and analysis:

```typescript
const response = await fetch('https://chess-api.com/v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fen: 'starting_position', depth: 15 })
});
```

## 📁 Project Structure

```
london-system-trainer/
├── pages/              # Next.js pages
├── components/         # React components
├── lib/
│   └── api/           # API integrations (Lichess, Stockfish)
├── styles/            # Global styles
└── public/            # Static assets
```

## 🎓 Documentation

- **README.md** - This file
- **SETUP.md** - Detailed setup instructions
- **PROJECT-OVERVIEW.md** - Quick reference guide
- **test-apis.js** - Test script to verify APIs

## 🆘 Next Steps

1. Read **SETUP.md** for detailed instructions
2. Run `node test-apis.js` to test API connectivity
3. Start building verified lessons using real master games!

## 📝 License

MIT License - feel free to use and modify!
