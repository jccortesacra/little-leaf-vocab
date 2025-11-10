# Admin Guide - Little-Leaf

This guide explains how to manage the Little-Leaf vocabulary app as an administrator.

## Becoming an Admin

To promote a user to admin status, you need database access. Run this SQL query in your Supabase SQL Editor or via the Lovable Cloud backend:

```sql
SELECT public.promote_to_admin('user@example.com');
```

Replace `user@example.com` with the actual email address of the user you want to promote.

### Verification

After promotion, the user should:
1. Log out and log back in
2. See an "Admin" badge in the header
3. Have access to admin-only features

## Admin Features

### 1. Create New Words

**Location**: Browse Vocabulary page → "New Word" button

**Process**:
1. Click "New Word" in the top-right corner
2. Fill in the form:
   - **English Word** (required, unique): The English vocabulary word
   - **Mongolian Translation** (required): The Mongolian equivalent
   - **Phonetic** (optional): IPA or romanization (e.g., `/sain uu/`)
   - **Audio** (optional): Upload MP3, WAV, or M4A file (max 5MB)
3. Click "Create Word"

**Tips**:
- Use consistent IPA formatting for phonetics
- Keep audio files under 5MB for faster loading
- Ensure English words are unique (the system will prevent duplicates)

### 2. Edit Existing Words

**Location**: Word Detail page → "Edit" button

**Process**:
1. Navigate to any word's detail page
2. Click "Edit" in the top-right corner
3. Modify any fields (note: English word cannot be changed once created)
4. Upload new audio if needed (replaces existing audio)
5. Click "Update Word"

**Limitations**:
- English word is locked after creation (to maintain URL consistency)
- To change an English word, you must delete and recreate it

### 3. Delete Words

**Location**: Word Detail page → "Delete" button

**Process**:
1. Navigate to the word's detail page
2. Click "Delete" in the top-right corner
3. Confirm the deletion in the dialog

**Warning**: Deleting a word will:
- Permanently remove the word from the vocabulary
- Delete all associated review data
- Remove the audio file from storage
- This action cannot be undone

## Audio Guidelines

### Supported Formats
- MP3 (recommended)
- WAV
- M4A

### Best Practices
1. **Quality**: Use clear, native pronunciation
2. **Volume**: Normalize audio levels
3. **Length**: Keep clips short (1-3 seconds)
4. **Size**: Optimize files to stay under 5MB
5. **Naming**: Use descriptive names before upload

### Recording Tips
- Record in a quiet environment
- Use consistent recording equipment
- Speak clearly and at natural pace
- Leave minimal silence at start/end

## Managing the Vocabulary

### Word Organization Strategy

**For Sprint 2**:
- Focus on high-frequency words first
- Group by theme (greetings, numbers, food, etc.)
- Include common phrases, not just single words

**Content Quality Checklist**:
- [ ] English word is spelled correctly
- [ ] Mongolian translation is accurate
- [ ] Phonetic transcription is consistent
- [ ] Audio is clear and native
- [ ] Word is appropriate for learners

## Bulk Operations

Currently, words must be added one at a time through the UI. 

**Future enhancement** (not in Sprint 2):
A bulk import feature using CSV or spreadsheet files.

## Monitoring Usage

### Check Word Count
Navigate to "Browse Vocabulary" to see all words in the system.

### Review Activity
Check the Progress page to monitor overall system usage (this shows aggregate data).

## Troubleshooting

### "Failed to create word"
- **Cause**: Duplicate English word
- **Solution**: Use a different English word or edit the existing one

### "Failed to upload audio"
- **Cause**: File too large or wrong format
- **Solution**: Compress audio or convert to MP3

### Can't see admin features
- **Cause**: Not logged in as admin or cache issue
- **Solution**: 
  1. Log out and log back in
  2. Verify admin status with SQL query
  3. Clear browser cache

### Audio not playing
- **Cause**: Audio file corrupt or wrong path
- **Solution**: Re-upload the audio file

## Security Best Practices

1. **Protect Admin Credentials**: Don't share admin login information
2. **Regular Audits**: Periodically review the vocabulary for accuracy
3. **Backup Data**: Export word lists regularly (via Supabase dashboard)
4. **Monitor Changes**: Check for unexpected deletions or edits

## Getting Help

For technical issues or feature requests:
1. Check the main [README.md](../README.md)
2. Review [SETUP.md](./SETUP.md) for configuration
3. Contact the development team

---

**Last Updated**: Sprint 2
**Admin Features Version**: 1.0
