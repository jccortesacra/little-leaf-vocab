# Setup Instructions

## Quick Start

1. **Sign Up / Log In**
   - Navigate to `/auth`
   - Create an account with email and password
   - Auto-confirm is enabled for testing (no email verification needed)

2. **Create Your First Deck**
   - Go to "Decks" in the navigation
   - Click "Create Deck"
   - Add a name (e.g., "Basic Phrases") and optional description

3. **Add Sample Cards** (Manual for Sprint 2)
   
   You can add cards directly via the database or use SQL:

   ```sql
   -- After creating a deck, insert some cards
   INSERT INTO cards (deck_id, user_id, front, back, pronunciation)
   VALUES 
     ('your-deck-id', 'your-user-id', 'Сайн байна уу', 'Hello', 'sain baina uu'),
     ('your-deck-id', 'your-user-id', 'Баярлалаа', 'Thank you', 'bayarlalaa'),
     ('your-deck-id', 'your-user-id', 'Уучлаарай', 'Sorry', 'uuchlaarai');
   ```

4. **Start Reviewing**
   - Return to Dashboard
   - Click "Start Review"
   - Flip cards and rate your knowledge (1-4)

## Environment Variables

All environment variables are auto-configured by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

No manual configuration needed!

## Database Access

Access your database via the Lovable Cloud backend interface:
1. Open your project in Lovable
2. Click on the Cloud tab
3. Navigate to Database → Tables
4. View/edit your tables

## Authentication Configuration

Current settings (configured for development):
- ✅ Auto-confirm email: Enabled
- ✅ Sign up: Enabled
- ❌ Anonymous users: Disabled

To change these settings, use the Lovable Cloud interface or update via code.

## Testing the App

### Test User Flow
1. Sign up with a test email
2. Create a deck called "Test Deck"
3. Manually add 5-10 cards via database
4. Go to Dashboard - verify stats show correct counts
5. Start Review - go through cards, rate them
6. Check Progress page - verify stats update

### Sample Test Data

```sql
-- Sample Mongolian vocabulary cards
INSERT INTO cards (deck_id, user_id, front, back, pronunciation) VALUES
  ('deck-id', 'user-id', 'Сайн байна уу', 'Hello', 'sain baina uu'),
  ('deck-id', 'user-id', 'Баярлалаа', 'Thank you', 'bayarlalaa'),
  ('deck-id', 'user-id', 'Уучлаарай', 'Sorry', 'uuchlaarai'),
  ('deck-id', 'user-id', 'Тийм', 'Yes', 'tiim'),
  ('deck-id', 'user-id', 'Үгүй', 'No', 'ugui'),
  ('deck-id', 'user-id', 'Сайн өглөө', 'Good morning', 'sain ugluu'),
  ('deck-id', 'user-id', 'Сайн үдийн мэнд', 'Good afternoon', 'sain udiin mend'),
  ('deck-id', 'user-id', 'Сайн уу', 'Goodbye', 'sain uu'),
  ('deck-id', 'user-id', 'Намайг ... гэдэг', 'My name is...', 'namaig ... gedeg'),
  ('deck-id', 'user-id', 'Танаар уулзахад ихэд баяртай', 'Nice to meet you', 'tanaar uulzahad ihed bayartai');
```

## Troubleshooting

### "No cards to review"
- Make sure you've created a deck
- Add cards to your deck via database
- Check that cards belong to your user_id

### Dashboard shows 0 for all stats
- Verify you have cards in the database
- Check that user_id matches your logged-in user
- Try refreshing the page

### Can't log in
- Check email/password are correct
- Ensure account was created successfully
- Clear browser cache and try again

### Build errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## Next Steps

After setup, see the main [README.md](../README.md) for feature documentation and [docs/sprints/](./sprints/) for sprint planning details.
