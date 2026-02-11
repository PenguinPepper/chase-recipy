# Chase - Recipe Manager App

## Overview

Chase is a cross-platform mobile recipe management app built with React Native and Expo. It allows users to save recipes from the web, manage grocery lists, track pantry inventory, and share with the community — all backed by Supabase for authentication and cloud persistence.

---

## Authentication

- **Email/password sign up** with optional display name
- **Email/password sign in**
- **Email verification** via confirmation link on sign up
- **Auth-gated routing** — unauthenticated users are redirected to the login screen
- **Sign out** with confirmation prompt
- **Session persistence** — sessions are maintained across app restarts via Supabase auth state listener
- **Profile screen** displaying user info (display name, email, account ID) and usage stats

---

## Recipe Management

### Adding Recipes
- **URL-based recipe import** — paste any recipe website URL to auto-extract title, image, source, and ingredients
- **YouTube video transcription** — paste a YouTube link to auto-transcribe audio using AssemblyAI and extract ingredients from the transcript
- **Instagram Reel extraction** — paste an Instagram Reel URL to extract caption and ingredients
- **Transcript viewer** — view timestamped transcript segments from video recipes
- **Manual ingredient entry** — add ingredients in natural language (e.g., "2 cups flour") with automatic parsing of quantity, unit, and category
- **Smart ingredient categorization** — ingredients are auto-categorized into produce, dairy, meat, seafood, bakery, pantry staples, frozen, beverages, spices, etc.
- **Editable recipe details** — tap to edit title, add/remove ingredients before saving
- **Duplicate URL detection** — if a URL has already been added as a public recipe, the app offers to reuse the existing data instead of re-extracting
- **Public/private visibility toggle** — choose to make a recipe public (discoverable by others) or keep it private
- **Fallback handling** — if metadata extraction fails, users can continue with manual entry

### Viewing Recipes
- **Recipe list** with image cards showing title, source, ingredient count, time added, and public/private badge
- **Recipe detail screen** with hero image, source link, ingredient list grouped by category
- **Pantry cross-reference** — each ingredient shows whether it's already in the user's pantry or missing
- **Stats summary** — total ingredients, items in pantry, and missing items at a glance
- **Open original source** — tap to open the original recipe URL in the browser
- **Toggle public/private** from the detail screen

### Deleting Recipes
- **Delete with confirmation** — removes the recipe and its associated grocery list
- **Auto-unpublish** — deleting a public recipe also removes it from the public database

---

## Explore (Community Recipes)

- **Browse recent public recipes** — see the latest recipes shared by the community
- **Search public recipes** by title
- **Save community recipes** — add any public recipe to your personal collection with one tap
- **Recipe cards** showing title, author name, source, ingredient count, and image

---

## Grocery Lists

- **Auto-generate grocery lists** from any saved recipe
- **Pantry-aware generation** — items already in your pantry are flagged as "In pantry"
- **Check off items** as you shop with visual strikethrough
- **Progress bar** showing completion percentage per list
- **Grouped by category** — items organized by produce, dairy, meat, etc. with emoji labels
- **Delete grocery lists** with confirmation
- **Share grocery lists** — generate a 6-character share code that others can use to import your list
- **Import shared lists** — enter a share code to import someone else's grocery list
- **Copy share code to clipboard** for easy sharing

---

## Pantry Management

- **Add pantry items** with name and category
- **Auto-categorization** — as you type an item name, the category is auto-detected
- **Category picker** — manually select from 11 food categories with emoji labels
- **Search pantry** — filter items by name
- **Grouped display** — items organized by category with item counts
- **Remove items** with confirmation
- **Pantry cross-referencing** — pantry items are checked against recipe ingredients across the app

---

## Data Persistence & Sync

- **Local storage** via AsyncStorage for offline access
- **Cloud sync** via Supabase — recipes, grocery lists, and pantry items are stored per user in a `user_data` table
- **Hybrid loading** — data is loaded from Supabase first, falling back to local storage
- **Optimistic updates** — UI updates immediately while data syncs in the background
- **React Query** for server state management with cache invalidation

---

## Supabase Backend

### Tables
- **`user_data`** — key-value store for per-user data (recipes, grocery lists, pantry items)
- **`public_recipes`** — community-shared recipes with full-text search
- **`shared_grocery_lists`** — shared grocery lists accessible via unique share codes

### Features Used
- Supabase Auth (email/password)
- Supabase Database (PostgreSQL)
- Row-level upserts with conflict handling

---

## UI/UX

- **Tab-based navigation** with 5 tabs: Recipes, Explore, Groceries, Pantry, Profile
- **Stack navigation** within each tab for drill-down screens
- **Modal presentation** for the Add Recipe flow
- **Cooking-themed icons** (CookingPot, ShoppingBasket, Refrigerator, etc.) from lucide-react-native
- **Warm color palette** with earthy tones
- **Responsive empty states** with illustrations and call-to-action buttons
- **Loading animations** with spinning indicators during async operations
- **Confirmation dialogs** for destructive actions (delete, discard, sign out)
- **Keyboard-aware layouts** for input-heavy screens
- **Cross-platform compatibility** — works on iOS, Android, and web via React Native Web

---

## Technical Stack

- **Framework**: React Native with Expo (SDK 54)
- **Routing**: Expo Router (file-based)
- **State Management**: React Query + createContextHook (@nkzw/create-context-hook)
- **Backend**: Supabase (Auth + Database)
- **AI/ML**: AssemblyAI for video transcription
- **Local Storage**: AsyncStorage
- **UI**: StyleSheet, lucide-react-native icons, expo-image
- **Language**: TypeScript (strict)
