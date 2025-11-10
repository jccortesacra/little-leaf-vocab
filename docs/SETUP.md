# Setup Guide - Little-Leaf

## Quick Start

```bash
npm install
npm run dev
```

## Admin Setup

After your first user signs up, promote them to admin:

```sql
SELECT public.promote_to_admin('your-email@example.com');
```

Run this in Lovable Cloud backend → Database → SQL Editor.

## Database Schema

### Tables

**decks** - Vocabulary words
- `english_word` (unique), `mongolian_translation`, `phonetic`, `audio_url`

**user_roles** - Access control
- `user_id`, `role` ('admin' | 'user')

**reviews** - Review history
- `deck_id`, `user_id`, `rating`, `next_review`

### Storage

**word-audio** bucket - Audio files (MP3, WAV, M4A, max 5MB)

## Testing

1. Sign up with email/password
2. Promote to admin via SQL
3. Add words via "New Word" button
4. Test audio upload
5. Start review session

## Troubleshooting

**Can't create words**: Verify admin status with SQL query
**Audio not playing**: Check file format and size
**Build errors**: Clear node_modules and reinstall

See [ADMIN.md](./ADMIN.md) for detailed admin instructions.
