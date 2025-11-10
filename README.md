# Little-Leaf - Mongolian Vocabulary Learning App

A modern web application for learning Mongolian vocabulary through spaced repetition. Built with React, TypeScript, and Supabase.

## Features

- **Word Dictionary**: Browse English words with Mongolian translations, phonetics, and audio
- **Admin Controls**: Role-based access for word management (create, edit, delete)
- **Audio Pronunciation**: Play audio files for each word
- **Spaced Repetition**: Review words with 1-4 rating system
- **Progress Tracking**: Monitor learning with statistics
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with Lexend font
- **Backend**: Lovable Cloud (Supabase)
- **Auth**: Email/password authentication
- **Storage**: Audio files in Supabase Storage

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Admin Setup

Promote a user to admin:

```sql
SELECT public.promote_to_admin('user@example.com');
```

See [docs/ADMIN.md](docs/ADMIN.md) for complete admin guide.

## Project Structure

```
src/
├── components/        # UI components
├── hooks/            # useAuth, useRole
├── pages/            # Route pages
└── integrations/     # Supabase client
```

## Documentation

- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [Admin Guide](docs/ADMIN.md) - Managing vocabulary

## Database Schema

- **decks**: English words with Mongolian translations
- **user_roles**: Admin access control
- **reviews**: Review history for spaced repetition
- **word-audio**: Audio pronunciation storage

## License

MIT
