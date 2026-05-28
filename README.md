# BiteWiseAI

> **Eat smart. Spend less. Feel better.**

BiteWiseAI is an AI-powered nutrition and food budget assistant built for hostel students and budget-conscious eaters in India. It helps you track what you eat, stay within your monthly food budget, and get personalized meal recommendations — all tailored to Indian foods and local prices.

---

## Features

- **Dashboard** — At-a-glance view of today's calories and monthly budget with visual progress bars
- **Dish Library** — Browse 20+ default Indian dishes or build your own personal food library with custom prices and nutrition info
- **Food Snap Log** — Upload a photo of your meal and let AI auto-detect the dish name, calories, and protein using Gemini Vision
- **AI Meal Planner** — Generate daily or weekly Indian meal plans optimized for your calorie target, budget, and dietary preference
- **Budget Optimizer** — Get smart food swaps, bulk-buy suggestions, and weekly templates to stretch your rupees further
- **AI Chat** — Conversational nutrition coach with persistent history, pre-seeded with Indian food context
- **Analytics** — 7-day charts for calories vs. target, daily spend vs. budget, and protein intake
- **User Profiles** — Set your age, weight, height, activity level, fitness goal, dietary preference, and monthly budget to personalize everything

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + shadcn/ui (New York style) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth + Google OAuth via Lovable Cloud |
| AI | Google Gemini 2.5 Flash via Lovable AI Gateway |


---

## Getting Started

### Installation

```bash
git clone https://github.com/your-username/BiteWiseAI.git
cd BiteWiseAI
npm i 
npm run dev
```

### Environment Variables

Create a `.dev.vars` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
LOVABLE_API_KEY=your_lovable_api_key
```

Also set the Vite-exposed variables for client-side use:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Database Setup

Run the migrations in order from `supabase/migrations/`:

```bash
supabase db push
```

This creates the `profiles`, `dishes`, `meal_logs`, and `chat_messages` tables, sets up RLS policies, and seeds 20 default Indian dishes.

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

---

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx              # Root layout, QueryClient, auth sync
│   ├── login.tsx               # Sign in / sign up / Google OAuth
│   └── _authenticated/
│       ├── index.tsx           # Home dashboard
│       ├── dishes.tsx          # Dish library
│       ├── foodlog.tsx         # Food snap log
│       ├── planner.tsx         # AI meal planner
│       ├── budget.tsx          # Budget optimizer
│       ├── chat.tsx            # AI chat
│       ├── analytics.tsx       # Weekly analytics
│       └── settings.tsx        # User profile settings
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── Navbar.tsx
│   ├── BottomNav.tsx
│   ├── DishCard.tsx
│   ├── BudgetBar.tsx
│   ├── CalorieBar.tsx
│   ├── FoodLogModal.tsx        # Photo upload + AI analysis
│   ├── LogMealModal.tsx        # Log from dish library
│   └── AddDishModal.tsx
├── lib/
│   ├── ai.functions.ts         # Server functions: chat, meal plan, budget, photo analysis
│   ├── queries.ts              # Supabase query helpers
│   ├── health.ts               # BMR, TDEE, BMI calculations
│   └── useAuth.ts              # Auth state hook
└── integrations/
    └── supabase/               # Auto-generated client, types, auth middleware
```

---

## Design System

The app uses a warm **terracotta + cream + sage** palette with:

- **Space Grotesk** for display headings
- **DM Sans** for body text
- Full dark mode support
- Responsive layout with a sticky top navbar (desktop) and bottom nav (mobile)

---

## License

MIT
