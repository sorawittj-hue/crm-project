export async function callGeminiAPI(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key Missing");
    return null;
  }

  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResponse.json();

    if (listData.error) throw new Error(listData.error.message);

    const validModel = listData.models?.find(m =>
      m.supportedGenerationMethods?.includes("generateContent") &&
      (m.name.includes("gemini") || m.name.includes("pro") || m.name.includes("flash"))
    );

    if (!validModel) throw new Error("No compatible Gemini models found.");

    const modelName = validModel.name.replace("models/", "");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(jsonStr);
      } catch {
        return { text }; // Fallback if not JSON
      }
    }
  } catch {
    console.error("AI Error");
    return null;
  }
}
