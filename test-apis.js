#!/usr/bin/env node

console.log('🧪 Testing Chess APIs...\n');

async function testLichess() {
  console.log('📚 Testing Lichess API (Free, No Key Required)...');
  
  try {
    const url = 'https://explorer.lichess.ovh/masters?play=d2d4,g8f6,c1f4,g7g6&topGames=3';
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ Lichess API working!');
    console.log(`   Found ${data.topGames.length} master games`);
    console.log(`   Statistics: ${data.white} wins, ${data.draws} draws, ${data.black} losses\n`);
  } catch (error) {
    console.error('❌ Lichess API failed:', error.message);
  }
}

async function testStockfish() {
  console.log('🔍 Testing Chess-API.com (Stockfish 17)...');
  
  try {
    const fen = 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1';
    const response = await fetch('https://chess-api.com/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, depth: 12 })
    });
    
    const data = await response.json();
    console.log('✅ Chess-API working!');
    console.log(`   Best move: ${data.move}`);
    console.log(`   Evaluation: ${data.eval > 0 ? '+' : ''}${(data.eval / 100).toFixed(2)}\n`);
  } catch (error) {
    console.error('❌ Chess-API failed:', error.message);
    console.log('   Note: Free tier is 100 requests/day\n');
  }
}

async function runTests() {
  await testLichess();
  await testStockfish();
  console.log('🎉 API Testing Complete!\n');
  console.log('📖 Next steps:');
  console.log('   1. Read SETUP.md for instructions');
  console.log('   2. Run: bun install');
  console.log('   3. Run: bun dev\n');
}

runTests().catch(console.error);
