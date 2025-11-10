# Little-Leaf - Mongolian Vocabulary Learning App

Master Mongolian vocabulary with spaced repetition flashcards.

## Sprint 2 - MVP Prototype

This is the Sprint 2 prototype featuring:
- ✅ User authentication (email/password)
- ✅ Dynamic dashboard with real-time stats
- ✅ Flashcard review system with 4-level ratings
- ✅ Deck management (CRUD operations)
- ✅ Progress tracking
- ✅ Responsive design following mockups

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with Lexend font
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Lovable Cloud account (automatically provisioned)

### Local Development

1. Clone the repository:
```bash
git clone <your-git-url>
cd little-leaf
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:8080](http://localhost:8080) in your browser

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Header.tsx
│   ├── StatCard.tsx
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
│   └── useAuth.tsx   # Authentication context
├── pages/            # Route pages
│   ├── Auth.tsx      # Login/Signup
│   ├── Dashboard.tsx # Main dashboard
│   ├── Progress.tsx  # Progress tracking
│   ├── Decks.tsx     # Deck management
│   └── Review.tsx    # Flashcard review
└── integrations/     # Backend integrations
    └── supabase/     # Auto-generated Supabase client
```

## Features

### Authentication
- Email/password sign up and login
- Auto-confirm email for development
- Protected routes
- Session persistence

### Dashboard
- **Due Today**: Cards scheduled for review
- **New**: Cards never reviewed
- **Mastered**: Cards rated "Easy" (4)
- Start Review CTA

### Review System
- Flashcard interface with flip animation
- 4-level rating system:
  - Again (1): Review in 10 minutes
  - Hard (2): Review in 1 hour
  - Good (3): Review in 1 day
  - Easy (4): Review in 3 days
- Progress indicator
- Click-to-flip cards

### Deck Management
- Create new decks
- List all decks with card counts
- Organize vocabulary by topic

### Progress Tracking
- Overall mastery percentage
- Learning vs. Mastered count
- Next review schedule
- Visual progress bar

## Database Schema

### Tables

**decks**
- id (UUID, PK)
- user_id (UUID)
- name (TEXT)
- description (TEXT, nullable)
- created_at, updated_at (TIMESTAMP)

**cards**
- id (UUID, PK)
- deck_id (UUID, FK -> decks)
- user_id (UUID)
- front (TEXT) - Mongolian text
- back (TEXT) - English translation
- pronunciation (TEXT, nullable)
- created_at, updated_at (TIMESTAMP)

**reviews**
- id (UUID, PK)
- card_id (UUID, FK -> cards)
- user_id (UUID)
- rating (INTEGER, 1-4)
- reviewed_at (TIMESTAMP)
- next_review (TIMESTAMP)

## Design System

### Colors
- **Primary**: Teal (#1ABC9C, hsl(174, 62%, 37%))
- **Accent**: Orange (#E67E22, hsl(29, 78%, 52%))
- **Success**: Green (same as primary)
- **Background**: Light gray (#F4F6F6)
- **Foreground**: Dark slate

### Typography
- Font Family: Lexend (Google Fonts)
- Weights: 300, 400, 500, 600, 700

### Components
All UI components use semantic design tokens from the design system defined in `src/index.css` and `tailwind.config.ts`.

## Sprint 2 Acceptance Criteria

✅ Public staging URL is live  
✅ User can sign up / log in  
✅ User can create a deck and add cards  
✅ Dashboard shows real database data  
✅ Review screen functional with ratings  
✅ Progress page shows statistics  
✅ Responsive design matches mockups  

## Known Limitations (Sprint 2)

- No Google OAuth (button present but disabled)
- Simple SRS algorithm (static intervals)
- No audio pronunciation playback
- No card editing/deletion in UI
- No deck selection for review
- No user profile management

## Next Steps (Sprint 3+)

- [ ] Advanced spaced repetition (SM-2 algorithm)
- [ ] Card editing and deletion
- [ ] Deck-specific review sessions
- [ ] Audio pronunciation with TTS
- [ ] Google OAuth integration
- [ ] User settings and preferences
- [ ] Statistics and charts
- [ ] Mobile app considerations
- [ ] Export/import functionality

## Deployment

This app auto-deploys via Lovable. Simply push to the connected repository and changes will be live.

For manual deployment:
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider

## Contributing

This is a Sprint 2 prototype. For production use, additional testing, security hardening, and feature development is recommended.

## License

All rights reserved - Little-Leaf Project
