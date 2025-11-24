import { analyzeWeatherImage } from "../services/imageAI.services";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function testWeatherImages() {
  // Verify API key is loaded
  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY not found in environment variables");
    console.log("   Make sure your .env file is in the project root");
    process.exit(1);
  }

  const assetsFolder = path.join(__dirname, "./../../assets");
  
  // Get all jpg images from assets folder
  const imageFiles = fs
    .readdirSync(assetsFolder)
    .filter(file => file.toLowerCase().endsWith(".jpg"))
    .map(file => path.join(assetsFolder, file));

  if (imageFiles.length === 0) {
    console.error("❌ No .jpg images found in assets folder");
    return;
  }

  console.log(`\n🔍 Found ${imageFiles.length} images to analyze\n`);
  console.log("=".repeat(60));

  const results: { file: string; score: number; error?: string }[] = [];

  // Analyze each image
  for (const imagePath of imageFiles) {
    const fileName = path.basename(imagePath);
    
    try {
      console.log(`\n📸 Analyzing: ${fileName}...`);
      const score = await analyzeWeatherImage(imagePath);
      
      // Validate score
      if (score < 1 || score > 10 || !Number.isInteger(score)) {
        console.log(`⚠️  Warning: Invalid score ${score} (expected 1-10)`);
      }
      
      const risk = score >= 7 ? "HIGH 🔴" : score >= 4 ? "MEDIUM 🟡" : "LOW 🟢";
      console.log(`   Result: ${score}/10 [${risk}]`);
      
      results.push({ file: fileName, score });
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      results.push({ file: fileName, score: -1, error: String(error) });
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SLIP RISK ANALYSIS SUMMARY\n");
  console.log("=".repeat(60));
  
  const successfulResults = results.filter(r => r.score !== -1);
  const failedResults = results.filter(r => r.score === -1);
  
  if (successfulResults.length > 0) {
    successfulResults
      .sort((a, b) => b.score - a.score)
      .forEach(({ file, score }) => {
        const risk = score >= 7 ? "HIGH 🔴" : score >= 4 ? "MEDIUM 🟡" : "LOW 🟢";
        console.log(`${file.padEnd(35)} ${score}/10  [${risk}]`);
      });
  }
  
  if (failedResults.length > 0) {
    console.log("\n⚠️  Failed analyses:");
    failedResults.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Successfully analyzed: ${successfulResults.length}/${imageFiles.length}`);
  console.log("=".repeat(60) + "\n");
}

// Run the test
testWeatherImages().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});