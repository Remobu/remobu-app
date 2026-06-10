import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 5;
const DELAY_MS = 500;

async function embedText(texts) {
  const results = [];
  for (const t of texts) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: t }] } })
      }
    );
    const data = await res.json();
    if (!data.embedding) {
      console.error('❌ Embedding error:', JSON.stringify(data));
      results.push(null);
    } else {
      results.push(data.embedding.values);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return results.every(r => r !== null) ? results : null;
}

async function main() {
  const pairs = JSON.parse(readFileSync('agri_context.json', 'utf8'));
  console.log(`📚 Total pairs: ${pairs.length}`);

  const existing = await prisma.agriEmbedding.count();
  console.log(`✅ Already embedded: ${existing}`);
  const remaining = pairs.slice(existing);
  console.log(`⏳ Remaining: ${remaining.length}`);

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const texts = batch.map(p => `${p.q} ${p.a}`.slice(0, 2000));
    const embeddings = await embedText(texts);
    if (!embeddings) { await new Promise(r => setTimeout(r, 2000)); continue; }

    for (let j = 0; j < batch.length; j++) {
      const vec = `[${embeddings[j].join(',')}]`;
      await prisma.$executeRaw`
        INSERT INTO "AgriEmbedding" (question, answer, embedding)
        VALUES (${batch[j].q.slice(0,500)}, ${batch[j].a.slice(0,1000)}, ${vec}::vector)
      `;
    }

    const done = existing + i + batch.length;
    if (done % 50 === 0) console.log(`📍 Progress: ${done}/${pairs.length}`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log('🎉 All embeddings done!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
