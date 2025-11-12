import JSZip from 'jszip';
import initSqlJs from 'sql.js';

export interface AnkiCard {
  english_word: string;
  mongolian_translation: string;
  phonetic?: string;
  audioFile?: Blob;
  audioFilename?: string;
  difficulty?: number;
}

interface ParseResult {
  cards: AnkiCard[];
  errors: string[];
}

export async function parseApkg(file: File): Promise<ParseResult> {
  const cards: AnkiCard[] = [];
  const errors: string[] = [];

  try {
    // Load the .apkg file as a ZIP
    const zip = await JSZip.loadAsync(file);

    // Load the SQLite database
    const collectionFile = zip.file('collection.anki2');
    if (!collectionFile) {
      throw new Error('Invalid .apkg file: collection.anki2 not found');
    }

    const collectionData = await collectionFile.async('uint8array');

    // Initialize SQL.js
    const SQL = await initSqlJs({
      locateFile: (filename) => `https://sql.js.org/dist/${filename}`,
    });

    const db = new SQL.Database(collectionData);

    // Parse media mapping (maps file numbers to original names)
    const mediaFile = zip.file('media');
    let mediaMapping: { [key: string]: string } = {};
    if (mediaFile) {
      const mediaJson = await mediaFile.async('text');
      mediaMapping = JSON.parse(mediaJson);
    }

    // Query notes from the database
    const result = db.exec('SELECT flds, tags FROM notes');
    
    if (!result.length || !result[0].values.length) {
      throw new Error('No cards found in deck');
    }

    // Process each note
    for (const row of result[0].values) {
      try {
        const fields = (row[0] as string).split('\x1f'); // Anki uses \x1f as field separator
        
        if (fields.length < 2) {
          errors.push(`Skipped card: Not enough fields`);
          continue;
        }

        // Extract fields - typical Mongolian decks have: English, Mongolian, [sound], [phonetic]
        let english = fields[0]?.trim() || '';
        let mongolian = fields[1]?.trim() || '';
        let phonetic = fields.length > 3 ? fields[3]?.trim() : undefined;
        let audioFilename: string | undefined;

        // Extract audio from sound tags: [sound:filename.mp3]
        const soundMatch = fields.join(' ').match(/\[sound:([^\]]+)\]/);
        if (soundMatch) {
          audioFilename = soundMatch[1];
        }

        // Clean HTML tags from fields
        english = english.replace(/<[^>]*>/g, '').trim();
        mongolian = mongolian.replace(/<[^>]*>/g, '').trim();
        if (phonetic) {
          phonetic = phonetic.replace(/<[^>]*>/g, '').trim();
        }

        // Load audio file if exists
        let audioFile: Blob | undefined;
        if (audioFilename) {
          // Try to find the audio file in the ZIP
          const mediaFileEntry = zip.file(audioFilename);
          if (mediaFileEntry) {
            const audioData = await mediaFileEntry.async('blob');
            audioFile = audioData;
          } else {
            // Try with media mapping
            const mappedName = Object.keys(mediaMapping).find(
              (key) => mediaMapping[key] === audioFilename
            );
            if (mappedName) {
              const mappedFile = zip.file(mappedName);
              if (mappedFile) {
                const audioData = await mappedFile.async('blob');
                audioFile = audioData;
              }
            }
          }
        }

        if (english && mongolian) {
          cards.push({
            english_word: english,
            mongolian_translation: mongolian,
            phonetic: phonetic || undefined,
            audioFile,
            audioFilename,
            difficulty: 1, // Default difficulty
          });
        } else {
          errors.push(`Skipped card: Missing English or Mongolian field`);
        }
      } catch (err) {
        errors.push(`Error parsing card: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    db.close();

    return { cards, errors };
  } catch (err) {
    throw new Error(`Failed to parse .apkg file: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
