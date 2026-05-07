Chase — Recipe Organizer

**Chase** is a cross-platform mobile app for saving recipes from the web, managing grocery lists, tracking pantry inventory, and estimating recipe costs in real time. Built with React Native and Expo, it runs on iOS, Android, and web from a single TypeScript codebase.

---

## Table of Contents

1. [What is Chase?](#what-is-chase)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Architecture Overview](#architecture-overview)
8. [Key Workflows](#key-workflows)

---

## What is Chase?

Chase helps home cooks go from "I saw a recipe online" to "I know exactly what to buy and how much it costs." Users can:

- Paste a recipe URL, YouTube link, or Instagram Reel to auto-extract ingredients.
- Build a smart grocery list that skips items already in the pantry.
- Get real-time price estimates from Walmart, Target, and Kroger.
- Share grocery lists with a 6-character code.
- Browse and save recipes shared by the community.

---

## Features

- **Recipe Management**
- **Grocery Lists**
- **Pantry Management**
- **Cost Estimation**
- **Community & Social recipe management**
- **Authentication & Sync**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native + Expo SDK 54 |
| **Routing** | Expo Router (file-based) |
| **Language** | TypeScript (strict) |
| **State** | React Query + `@nkzw/create-context-hook` |
| **Auth & DB** | Supabase (PostgreSQL + Auth) |
| **API Layer** | tRPC + Hono server |
| **Web Scraping** | Zyte API (structured e-commerce extraction) |
| **Video Transcription** | AssemblyAI |
| **Local Storage** | AsyncStorage |
| **Icons** | lucide-react-native |
| **Images** | expo-image |

---

## Project Structure

```
expo/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── (home)/               # Recipes tab
│   │   ├── explore/              # Community recipes tab
│   │   ├── groceries/            # Grocery lists tab
│   │   ├── pantry/               # Pantry tab
│   │   ├── profile/              # Profile tab
│   │   └── _layout.tsx           # Tab bar configuration
│   ├── _layout.tsx               # Root layout (providers + auth gate)
│   ├── add-recipe.tsx            # Modal: add/import recipe
│   ├── recipe-detail.tsx         # Recipe detail screen
│   ├── login.tsx                 # Login screen
│   └── signup.tsx                # Sign-up screen
│
├── backend/                      # tRPC + Hono server
│   ├── trpc/
│   │   ├── app-router.ts         # tRPC router definitions
│   │   └── create-context.ts     # tRPC context factory
│   └── hono.ts                   # Hono app entry point
│
├── components/                   # Reusable UI components
│   └── CostEstimator.tsx         # Price estimation panel
│
├── constants/
│   └── colors.ts                 # App-wide color palette
│
├── contexts/                     # Global state providers
│   ├── AuthContext.tsx           # Auth state + Supabase session
│   └── ChaseContext.tsx          # Recipes, groceries, pantry
│
├── lib/                          # Shared libraries
│   ├── supabase.ts               # Supabase client
│   ├── trpc.ts                   # tRPC client setup
│   ├── publicRecipes.ts          # Public recipe helpers
│   └── sharedGrocery.ts          # Grocery list sharing helpers
│
├── types/
│   └── index.ts                  # TypeScript interfaces (Recipe, Ingredient, etc.)
│
├── utils/                        # Business logic utilities
│   ├── recipeExtractor.ts        # Web recipe extraction
│   ├── videoExtractor.ts         # YouTube / Instagram extraction
│   ├── ingredientNormalizer.ts   # Ingredient name normalization
│   └── grocerySearchTerms.ts     # Search-term mapping for grocery stores
│
├── assets/images/                # App icons, splash, favicon
├── app.json                      # Expo configuration
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (via [nvm](https://github.com/nvm-sh/nvm) recommended)
- [Bun](https://bun.sh/docs/installation)
- An Expo Go app on your phone (or iOS Simulator / Android Emulator)

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate to the project
cd expo

# 3. Install dependencies
bun install
```

### Environment Variables

Create a `.env` use `env.example` as a guide file in the `expo/` directory and fill in the values.

> **Note:** All variables are public (client-side) and prefixed with `EXPO_PUBLIC_`.

### Running the App

```bash
# Start the development server (web + native)
bun run start

# Start web preview only
bun run start-web

# Start with debug logging
bun run start-web-dev

# Lint
bun run lint
```

To open on a device:
1. Run `bun run start`
2. Scan the QR code with **Expo Go** (iOS / Android)

To open in a simulator:
```bash
bun run start -- --ios      # iOS Simulator
bun run start -- --android  # Android Emulator
```

---

## Architecture Overview

### Data Flow

```
User Action
    |
    v
React Component (Screen)
    |
    v
Context Hook (ChaseContext / AuthContext)
    |
    v
Supabase Client  -------->  Supabase DB (user_data, public_recipes)
    |                                    (shared_grocery_lists)
    v
AsyncStorage (fallback)
```

### Price Estimation Flow

```
Recipe Ingredient
    |
    v
Ingredient Normalizer  ---->  "flour" → "all-purpose flour"
    |                              with default qty & unit
    v
Grocery Search Terms  ----->  "all purpose flour 5lb"
    |
    v
tRPC Client  -------------->  tRPC Server (Hono)
    |                              |
    |                              v
    |                         Zyte API
    |                              |
    |                              v
    |                         Walmart / Target / Kroger
    |                              |
    |                              v
    |                         Product name, price, unit size
    |                              |
    v                         v
CostEstimator.tsx  <------  Best match + unit-price calc
```

---

## Key Workflows

### Adding a Recipe from a URL
1. User taps **+** → enters URL.
2. `recipeExtractor.ts` fetches and parses OpenGraph / JSON-LD metadata.
3. Ingredients are parsed and categorized automatically.
4. User can edit title and ingredients before saving.
5. Recipe is saved to Supabase `user_data` (and optionally `public_recipes`).

### Generating a Grocery List
1. User opens a recipe and taps **Generate Grocery List**.
2. `ChaseContext` creates a `GroceryList` from the recipe's ingredients.
3. Each item is cross-referenced against the pantry.
4. List is persisted to Supabase.

### Estimating Recipe Cost
1. User taps **Estimate Cost** on a recipe.
2. Each ingredient is normalized and mapped to a grocery search term.
3. tRPC's `searchIngredientPrice` queries Zyte for each store.
4. `CostEstimator.tsx` displays per-ingredient matches and a store breakdown.

### Sharing a Grocery List
1. User opens a grocery list and taps **Share**.
2. A 6-character share code is generated and stored in `shared_grocery_lists`.
3. Another user enters the code → list is cloned into their account.
