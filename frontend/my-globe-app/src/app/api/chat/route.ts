import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, countryData } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let contextPrompt = "";
    if (countryData) {
        const summaryData = {
          country: countryData.countryName,
          top_areas: countryData.topSubfields?.slice(0, 5), // Limit context to top 5 to save tokens
          specializations: countryData.uniqueSubfields?.slice(0, 3),
        };
        
        contextPrompt = `
        You are an expert Research Analyst.
        
        Data for **${countryData.countryName}**:
        ${JSON.stringify(summaryData)}
        
        STRICT RULES:
        1. **KEEP IT SHORT.** Maximum 3 sentences or 3 short bullet points.
        2. **NO FLUFF.** Go straight to the answer. Do not say "Based on the data..." or "Here is the info...".
        3. If asking for the top field, just name it and give the number.
        4. If asking for trends/reasons, give one specific, punchy insight.
        5. Do not use complex formatting, just bolding for key terms.
        `;
    } else {
        contextPrompt = "User has not selected a country. Politely ask them to click a country on the globe first. Keep it very short.";
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `System Context: ${contextPrompt}` },
            { text: `User Question: ${message}` }
          ]
        }
      ]
    });
    
    const response = result.response.text();
    return NextResponse.json({ response });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process request" 
    }, { status: 500 });
  }
}
