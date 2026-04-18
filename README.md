# Veetaa Website

Web version of the Veetaa delivery app. Same functionality as the mobile app, with a responsive web layout.

## Setup

1. **Environment** – Use the same env as the mobile app. Create `.env` in the project root:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_ANTI_VPN_ENDPOINT=
```

2. **Install and run**

```bash
npm install
npm run dev
```

Open http://localhost:3001 (or the port shown).

3. **Build for production**

```bash
npm run build
npm run preview
```

## Features (aligned with mobile app)

- **Auth**: Login, signup, email OTP verification, password reset, permissions
- **Home**: Categories, stores, search, location, favorites
- **Stores & products**: Browse by category, store detail, product order view
- **Cart & checkout**: Cart, delivery address (map picker), payment (cash/transfer), RIB, receipt upload
- **Orders**: History, reorder, track order
- **Profile**: Settings, profile edit, language (FR/AR/EN), help, privacy, notifications
- **Other**: Blocked / VPN blocked / out-of-zone views, offline detection

## Logo

The header uses `/634156c3-443e-4208-9f43-f043a5a54076.png`. Copy the same asset from the mobile app `public` folder into this project’s `public` folder if you have it, or replace the path in `src/layout/WebLayout.tsx`.
