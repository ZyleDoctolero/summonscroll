import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Batch Monster Art Generation Script
 *
 * This script regenerates monster portraits using the Gemini API based on the
 * triage report findings. All existing monster images need regeneration due to
 * missing alpha channels.
 *
 * Prerequisites:
 * 1. Set GEMINI_API_KEY in your .env file (get from Google AI Studio)
 * 2. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured
 * 3. Set CURRENT_RELEASED_MAX to control batch size (default: 150)
 *
 * Usage:
 *   node scripts/regen_monsters.mjs
 *
 * Cost Estimate:
 *   Gemini image generation: ~$0.04 per image
 *   150 monsters = ~$6.00 USD
 */

// Configuration constants
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CURRENT_RELEASED_MAX = parseInt(process.env.CURRENT_RELEASED_MAX || "150");

// Validate required environment variables
function validateEnvironment() {
  const missing = [];

  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
    missing.push("GEMINI_API_KEY");
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nPlease update your .env file with the required API keys.");
    console.error("For GEMINI_API_KEY, visit: https://aistudio.google.com/app/apikey");
    return false;
  }

  return true;
}

// Initialize clients (only after validation)
let supa, genAI, model;

function initializeClients() {
  supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Updated model name to match Gemini 2.0 image generation capability
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp" });
}

// Load the prompt template
let PROMPT_TEMPLATE;

async function loadPromptTemplate() {
  try {
    PROMPT_TEMPLATE = await fs.readFile("prompts/MONSTER_ART_PROMPT.md", "utf8");
  } catch (error) {
    console.error("❌ Could not load prompt template from prompts/MONSTER_ART_PROMPT.md");
    console.error("Make sure the file exists and is readable.");
    throw error;
  }
}

async function batchGeneration() {
  console.log(
    `🚀 Starting batch generation for monsters up to bestiary_id ${CURRENT_RELEASED_MAX}`,
  );

  // Fetch monsters from database
  console.log("📡 Fetching monsters from database...");
  const { data: monsters, error } = await supa
    .from("monsters")
    .select("id, name, rarity, role, element, bestiary_id")
    .lte("bestiary_id", CURRENT_RELEASED_MAX)
    .order("bestiary_id");

  if (error) {
    console.error("❌ Error fetching monsters:", error.message);
    console.error("Please check your Supabase configuration and network connection.");
    throw error;
  }

  console.log(`📊 Found ${monsters.length} monsters to process`);

  // Ensure output directory exists
  const outputDir = "public/sprites/monsters";
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  let processed = 0;
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const monster of monsters) {
    processed++;
    const filename = monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".png";
    const outpath = path.join(outputDir, filename);

    // Check if file already exists
    if (await fileExists(outpath)) {
      console.log(`[${processed}/${monsters.length}] ⏭️  SKIP ${filename} (already exists)`);
      skipped++;
      continue;
    }

    // Build the prompt with monster data
    const prompt = PROMPT_TEMPLATE.replace(/\{name\}/g, monster.name)
      .replace(/\{rarity\}/g, monster.rarity)
      .replace(/\{role\}/g, monster.role)
      .replace(/\{element\}/g, monster.element)
      .replace(/\{origin\}/g, "generated"); // Default origin since not in database

    try {
      console.log(`[${processed}/${monsters.length}] 🎨 Generating ${filename}...`);

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const response = result.response;

      // Look for image data in the response
      const candidates = response.candidates || [];
      let imageData = null;

      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith("image/")) {
            imageData = part.inlineData.data;
            break;
          }
        }
        if (imageData) break;
      }

      if (imageData) {
        // Write the image file
        await fs.writeFile(outpath, Buffer.from(imageData, "base64"));
        console.log(`[${processed}/${monsters.length}] ✅ WROTE ${filename}`);
        generated++;
      } else {
        console.log(
          `[${processed}/${monsters.length}] ❌ MISS  ${filename} (no image data in response)`,
        );
        console.log("Response structure:", JSON.stringify(response, null, 2));
        errors++;
      }
    } catch (e) {
      console.log(`[${processed}/${monsters.length}] ❌ ERROR ${filename}: ${e.message}`);
      errors++;

      // If it's a quota/rate limit error, suggest waiting
      if (e.message.includes("quota") || e.message.includes("rate")) {
        console.log("💡 Consider waiting longer between requests or reducing batch size");
      }
    }

    // Rate limiting to avoid API limits (2 seconds between requests)
    if (processed < monsters.length) {
      console.log("⏱️  Waiting 2s for rate limiting...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("\n🎉 === Batch Generation Complete ===");
  console.log(`📈 Total processed: ${processed}`);
  console.log(`✅ Generated: ${generated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  if (generated > 0) {
    console.log(`💰 Estimated cost: ~$${(generated * 0.04).toFixed(2)} USD`);
  }

  if (errors > 0) {
    console.log(`\n⚠️  ${errors} errors occurred. Check the logs above for details.`);
    console.log("Common issues:");
    console.log("- Invalid GEMINI_API_KEY");
    console.log("- API rate limits exceeded");
    console.log("- Network connectivity issues");
  }
}

async function fileExists(filepath) {
  try {
    await fs.stat(filepath);
    return true;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log("🎮 SummonScroll Monster Art Batch Generator");
  console.log("==========================================\n");

  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }

  // Initialize clients
  initializeClients();

  // Load prompt template
  await loadPromptTemplate();

  // Run batch generation
  await batchGeneration();
}

// Run the batch generation
main().catch((error) => {
  console.error("\n💥 Fatal error:", error.message);
  process.exit(1);
});
