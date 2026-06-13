# Scripts Directory

This directory contains utility scripts for the SummonScroll project.

## Monster Art Generation Scripts

### `triage_monsters.mjs`

Analyzes existing monster images and creates a triage report identifying which images need regeneration.

**Usage:**

```bash
npm install --save-dev sharp  # Only needed once
node scripts/triage_monsters.mjs
```

**Output:** Creates `triage_report.csv` with analysis of all monster images.

### `regen_monsters.mjs`

**Batch generation runner for monster portraits using Gemini API**

This script regenerates monster portraits based on the triage report findings. All existing monster images in the project need regeneration due to missing alpha channels.

**Prerequisites:**

1. **Gemini API Key** - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Supabase Configuration** - Already configured in this project
3. **Dependencies** - Install with: `npm install @google/generative-ai dotenv`

**Environment Setup:**
Add to your `.env` file:

```env
GEMINI_API_KEY=your-actual-gemini-api-key-here
CURRENT_RELEASED_MAX=150
```

**Usage:**

```bash
node scripts/regen_monsters.mjs
```

**Features:**

- ✅ Validates environment variables before starting
- ✅ Fetches monster data from Supabase database
- ✅ Generates consistent anime-style portraits using Gemini 2.0
- ✅ Rate limiting (2s between requests) to avoid API limits
- ✅ Skips existing files to avoid regenerating
- ✅ Progress tracking and cost estimation
- ✅ Detailed error reporting and troubleshooting hints

**Cost Estimation:**

- Gemini image generation: ~$0.04 per image
- 150 monsters ≈ $6.00 USD
- 500 monsters ≈ $20.00 USD

**Batch Size Control:**
Use `CURRENT_RELEASED_MAX` environment variable to control how many monsters to process:

```env
CURRENT_RELEASED_MAX=50    # Process only first 50 monsters (test run)
CURRENT_RELEASED_MAX=150   # Default production batch
```

**Troubleshooting:**

- **"Missing GEMINI_API_KEY"** - Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate a key
- **"Invalid API key"** - Check your Supabase configuration
- **"quota" or "rate" errors** - Reduce batch size or increase rate limiting delay
- **No image data in response** - Gemini API might be having issues, try again later

**Output:**
Generated images are saved to `public/sprites/monsters/` with names matching the monster's slug (lowercase, underscores).

## Other Scripts

### `import_monsters.mjs`

Imports monster data from CSV into the database.

### `create_queue.mjs`, `setup_queue_500.mjs`, `update_and_pop.mjs`

Queue management utilities for monster processing.

### `vercel-output.js`

Vercel deployment configuration.
