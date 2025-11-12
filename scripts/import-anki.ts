import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { basename } from 'path';

// Configuration
const APKG_FILE_PATH = process.argv[2] || './mongolian-deck.apkg';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID!; // Set this to your admin user ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_USER_ID) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface AnkiCard {
  english: string;
  mongolian: string;
  phonetic?: string;
  audioFilename?: string;
  audioData?: Buffer;
  audio_url?: string;
}

async function extractApkg(filePath: string): Promise<{ zip: AdmZip; dbPath: string }> {
  console.log(`📦 Extracting ${basename(filePath)}...`);
  const zip = new AdmZip(filePath);
  
  // Extract to temp directory
  const tempDir = './temp-anki-extract';
  zip.extractAllTo(tempDir, true);
  
  const dbPath = `${tempDir}/collection.anki2`;
  console.log('✓ Extracted successfully');
  
  return { zip, dbPath };
}

function parseAnkiDatabase(dbPath: string, zip: AdmZip): AnkiCard[] {
  console.log('🔍 Parsing Anki database...');
  
  const db = new Database(dbPath, { readonly: true });
  const notes = db.prepare('SELECT id, flds FROM notes').all() as { id: number; flds: string }[];
  
  console.log(`Found ${notes.length} notes in deck`);
  
  const cards: AnkiCard[] = [];
  
  for (const note of notes) {
    const fields = note.flds.split('\t');
    
    // Parse fields - adjust indices based on your deck structure
    const english = fields[0]?.trim();
    const mongolian = fields[1]?.trim();
    const phonetic = fields[2]?.trim();
    
    // Extract audio filename from [sound:filename.mp3] tags
    let audioFilename: string | undefined;
    let audioData: Buffer | undefined;
    
    // Check all fields for sound tags
    for (const field of fields) {
      const soundMatch = field.match(/\[sound:(.*?)\]/);
      if (soundMatch) {
        audioFilename = soundMatch[1];
        
        // Try to find the audio file in the ZIP
        const entries = zip.getEntries();
        for (const entry of entries) {
          // Anki stores media files as numbers (0, 1, 2, etc.)
          // We need to check the media file mapping or try common patterns
          if (entry.entryName === audioFilename || 
              entry.entryName.endsWith(audioFilename) ||
              entry.entryName.match(/^\d+\.(mp3|wav|ogg)$/)) {
            try {
              audioData = zip.readFile(entry);
              if (audioData && audioData.length > 0) {
                break;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
        break;
      }
    }
    
    if (english && mongolian) {
      cards.push({
        english,
        mongolian,
        phonetic: phonetic || undefined,
        audioFilename,
        audioData
      });
    }
  }
  
  db.close();
  console.log(`✓ Parsed ${cards.length} valid cards`);
  console.log(`  ${cards.filter(c => c.audioData).length} cards with audio`);
  
  return cards;
}

async function uploadAudio(card: AnkiCard, index: number): Promise<string | null> {
  if (!card.audioData || !card.audioFilename) {
    return null;
  }
  
  try {
    const timestamp = Date.now();
    const sanitizedName = card.english.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${timestamp}-${index}-${sanitizedName}.mp3`;
    
    const { data, error } = await supabase.storage
      .from('word-audio')
      .upload(filename, card.audioData, {
        contentType: 'audio/mpeg',
        upsert: false
      });
    
    if (error) {
      console.error(`  ❌ Failed to upload audio for "${card.english}":`, error.message);
      return null;
    }
    
    return `word-audio/${filename}`;
  } catch (error) {
    console.error(`  ❌ Error uploading audio for "${card.english}":`, error);
    return null;
  }
}

async function uploadAllAudio(cards: AnkiCard[]): Promise<void> {
  const cardsWithAudio = cards.filter(c => c.audioData);
  
  if (cardsWithAudio.length === 0) {
    console.log('⚠️  No audio files found in deck');
    return;
  }
  
  console.log(`📤 Uploading ${cardsWithAudio.length} audio files...`);
  
  let uploaded = 0;
  let failed = 0;
  
  for (let i = 0; i < cardsWithAudio.length; i++) {
    const card = cardsWithAudio[i];
    const audioUrl = await uploadAudio(card, i);
    
    if (audioUrl) {
      card.audio_url = audioUrl;
      uploaded++;
    } else {
      failed++;
    }
    
    // Progress indicator
    if ((i + 1) % 10 === 0 || i === cardsWithAudio.length - 1) {
      console.log(`  Progress: ${i + 1}/${cardsWithAudio.length} (${uploaded} succeeded, ${failed} failed)`);
    }
  }
  
  console.log(`✓ Audio upload complete: ${uploaded} succeeded, ${failed} failed`);
}

async function insertCards(cards: AnkiCard[]): Promise<void> {
  console.log(`💾 Inserting ${cards.length} cards into database...`);
  
  const rows = cards.map(card => ({
    english_word: card.english,
    mongolian_translation: card.mongolian,
    phonetic: card.phonetic || null,
    audio_url: card.audio_url || null,
    difficulty: 1, // Default difficulty
    name: card.english,
    description: card.mongolian,
    user_id: ADMIN_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Insert in batches of 100 to avoid timeout
  const batchSize = 100;
  let inserted = 0;
  let failed = 0;
  
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('decks')
      .insert(batch);
    
    if (error) {
      console.error(`  ❌ Failed to insert batch ${i / batchSize + 1}:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }
    
    console.log(`  Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
  
  console.log(`✓ Database insert complete: ${inserted} succeeded, ${failed} failed`);
}

async function main() {
  console.log('🚀 Starting Anki deck import...\n');
  
  try {
    // Step 1: Extract .apkg file
    const { zip, dbPath } = await extractApkg(APKG_FILE_PATH);
    
    // Step 2: Parse Anki database
    const cards = parseAnkiDatabase(dbPath, zip);
    
    if (cards.length === 0) {
      console.error('❌ No cards found in deck!');
      process.exit(1);
    }
    
    // Step 3: Upload audio files
    await uploadAllAudio(cards);
    
    // Step 4: Insert cards into database
    await insertCards(cards);
    
    console.log('\n✨ Import completed successfully!');
    console.log(`Total cards: ${cards.length}`);
    console.log(`Cards with audio: ${cards.filter(c => c.audio_url).length}`);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
