import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = "Curriculum";

const PDFS = [
  { file: "🔝Floor .pdf", title: "🔝Floor Overview", notes: "Introduction to the 🔝Floor trading system and community." },
  { file: "Mastering ICT Liquidity (1) (1) (1).pdf", title: "Mastering ICT Liquidity", notes: "Deep dive into ICT liquidity concepts and how to trade them." },
  { file: "High Probability Entry Model by fahdifx (1).pdf", title: "High Probability Entry Model", notes: "Step-by-step entry model for high-probability trade setups." },
  { file: "OTE TTrades (2) (2).pdf", title: "OTE Trades - Part 1", notes: "Optimal Trade Entry framework — Part 1." },
  { file: "OTE TTrades (2) (3).pdf", title: "OTE Trades - Part 2", notes: "Optimal Trade Entry framework — Part 2." },
];

async function seed() {
  console.log("Creating module...");

  // Create module
  const { data: mod, error: modErr } = await supabase
    .from("curriculum_modules")
    .insert({ title: "Intro Curriculum", description: "Foundation materials included with every membership.", tier: "bronze", order_index: 0 })
    .select()
    .single();

  if (modErr) {
    console.error("Module error:", modErr.message);
    process.exit(1);
  }

  console.log("Module created:", mod.id);

  for (let i = 0; i < PDFS.length; i++) {
    const { file, title, notes } = PDFS[i];
    const filePath = join(__dirname, "../public/curriculum", file);

    console.log(`Uploading: ${file}`);
    const buffer = readFileSync(filePath);
    const storagePath = `${mod.id}/${i}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });

    if (uploadErr) {
      console.error(`Upload error for ${file}:`, uploadErr.message);
      continue;
    }

    const { error: lessonErr } = await supabase
      .from("curriculum_lessons")
      .insert({ module_id: mod.id, title, notes, pdf_path: storagePath, order_index: i });

    if (lessonErr) {
      console.error(`Lesson error for ${title}:`, lessonErr.message);
    } else {
      console.log(`✓ ${title}`);
    }
  }

  console.log("\nDone! Intro curriculum seeded.");
}

seed();
