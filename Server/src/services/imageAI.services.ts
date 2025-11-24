import axios from "axios";
import fs from "fs";
import sharp from "sharp";

async function compressImage(imagePath: string): Promise<string> {
  // Compress image to max 800x800 and reduce quality
  const buffer = await sharp(imagePath)
    .resize(800, 800, { 
      fit: "inside",
      withoutEnlargement: true 
    })
    .jpeg({ quality: 70 })
    .toBuffer();
  
  const sizeKB = buffer.length / 1024;
  console.log(`   Compressed to: ${sizeKB.toFixed(2)} KB`);
  
  return buffer.toString("base64");
}

export async function analyzeWeatherImage(imagePath: string): Promise<number> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const prompt = `Analyze this image to assess slip risk for vehicles on outdoor surfaces.

Focus on these factors:
- Surface type (road, pavement, gravel, etc.)
- Visible moisture (rain, puddles, ice, snow)
- Weather conditions (fog, rain, snow, dry)
- Surface texture and visibility
- Any visible hazards (oil, debris, standing water)

Consider:
- Wet surfaces: 6-8 risk
- Ice/snow: 8-10 risk
- Dry surfaces: 1-3 risk
- Light rain: 4-6 risk
- Heavy rain/flooding: 7-9 risk

If the image shows an indoor environment, rate it 1.

Respond with ONLY a single number from 1-10 representing the slip risk for a car driving on this surface.`;

  // Get original size
  const imageBuffer = fs.readFileSync(imagePath);
  const originalSizeKB = imageBuffer.length / 1024;
  console.log(`   Original size: ${originalSizeKB.toFixed(2)} KB`);
  
  // Compress image
  const base64Image = await compressImage(imagePath);

  try {
    // Use Llama 4 Scout vision model
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // Updated to Llama 4 Scout
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000 // 60 second timeout
      }
    );

    // Extract the response
    const resultText = response.data.choices[0].message.content.trim();
    console.log(`   Raw response: "${resultText}"`);
    
    const match = resultText.match(/\d+/);
    const value = match ? parseInt(match[0], 10) : 5;
    
    // Clamp value between 1-10
    return Math.max(1, Math.min(10, value));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.log(`   API Error Details:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}