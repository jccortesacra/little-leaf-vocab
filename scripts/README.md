# Anki Deck Import Script

This script imports Anki (.apkg) decks with audio files into the Little-Leaf database.

## Setup

1. **Set environment variables** in your `.env` file:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_USER_ID=your_admin_user_id
   ```

   To get your admin user ID, run this query in your database:
   ```sql
   SELECT id FROM auth.users WHERE email = 'your-admin@email.com';
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Download the Anki deck** from https://ankiweb.net/shared/info/1157492766
   Save it to the project root or specify path when running.

## Usage

Run the import script:

```bash
# Default: looks for ./mongolian-deck.apkg
npx tsx scripts/import-anki.ts

# Or specify a custom path
npx tsx scripts/import-anki.ts /path/to/your-deck.apkg
```

## What it does

1. ✅ Extracts the .apkg file (ZIP archive)
2. ✅ Parses the SQLite database (collection.anki2)
3. ✅ Extracts vocabulary cards with:
   - English word
   - Mongolian translation
   - Phonetic pronunciation
   - Audio files
4. ✅ Uploads audio files to Supabase storage (`word-audio` bucket)
5. ✅ Inserts all cards into the `decks` table
6. ✅ Shows progress and summary

## Output

```
🚀 Starting Anki deck import...

📦 Extracting mongolian-deck.apkg...
✓ Extracted successfully
🔍 Parsing Anki database...
Found 1247 notes in deck
✓ Parsed 1247 valid cards
  1189 cards with audio
📤 Uploading 1189 audio files...
  Progress: 10/1189 (10 succeeded, 0 failed)
  Progress: 20/1189 (20 succeeded, 0 failed)
  ...
  Progress: 1189/1189 (1187 succeeded, 2 failed)
✓ Audio upload complete: 1187 succeeded, 2 failed
💾 Inserting 1247 cards into database...
  Progress: 100/1247
  Progress: 200/1247
  ...
  Progress: 1247/1247
✓ Database insert complete: 1247 succeeded, 0 failed

✨ Import completed successfully!
Total cards: 1247
Cards with audio: 1187
```

## Troubleshooting

**Audio files not found:**
- The script tries to match audio filenames from `[sound:...]` tags
- Some Anki decks use numbered media files (0.mp3, 1.mp3, etc.)
- Check the .apkg contents if audio isn't being detected

**Database errors:**
- Ensure `ADMIN_USER_ID` is set correctly
- Verify your service role key has proper permissions
- Check that the `word-audio` storage bucket exists and is public

**Field mapping issues:**
- The script assumes: Field 0 = English, Field 1 = Mongolian, Field 2 = Phonetic
- Adjust the field indices in `parseAnkiDatabase()` if your deck structure differs

## After Import

1. Check your database:
   ```sql
   SELECT COUNT(*) FROM decks;
   SELECT COUNT(*) FROM decks WHERE audio_url IS NOT NULL;
   ```

2. Verify audio files in Supabase Storage → `word-audio` bucket

3. Test in the app:
   - Navigate to Review page
   - Audio should play when clicking speaker icons

## Cleanup

After successful import, you can:
- Delete the `temp-anki-extract/` directory
- Archive or delete the `.apkg` file
- Keep the script for future imports
