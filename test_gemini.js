const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Modelos:", JSON.stringify(data.models?.map(m => m.name), null, 2));
    if (data.error) console.error("API Error:", data.error);
  } catch (err) {
    console.error(err);
  }
}
run();
