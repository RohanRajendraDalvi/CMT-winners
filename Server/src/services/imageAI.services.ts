
import axios from "axios";
import fs from "fs";

export async function analyzeWeatherImage(imagePath: string): Promise<number> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const prompt = `describe if this weather condition can result in slippery surfaces, indoor environments are mostly safe. 
  give the chances of car slipping here from 1-10, answer a single number`;

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  // Adjust endpoint to match Groq’s vision model
  const response = await axios.post(
    "https://api.groq.com/v1/vision",
    {
      model: "llama-vision-11b",
      prompt,
      images: [base64Image],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Expecting a single number
  const value = parseInt(response.data.result.trim(), 10);
  return value;
}
