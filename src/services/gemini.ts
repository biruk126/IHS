import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatResponse(
  message: string, 
  history: { role: string; parts: { text: string }[] }[], 
  language: "EN" | "AM" = "EN",
  imageData?: string
) {
  try {
    const parts: any[] = [{ text: message }];
    
    if (imageData) {
      parts.push({
        inlineData: {
          data: imageData.split(",")[1],
          mimeType: "image/jpeg",
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts }],
      config: {
        systemInstruction: `You are a helpful, empathetic, and professional healthcare assistant. 
        
        STRICT POLICY: You MUST ONLY provide information and answer questions related to health, wellness, medical conditions, medications, and general healthcare. 
        If a user asks about any non-health related topic (e.g., politics, sports, general knowledge, entertainment, etc.), you MUST politely decline and state that you are a specialized healthcare assistant and can only assist with health-related inquiries.
        
        IF AN IMAGE IS PROVIDED: Analyze the image. If it contains a medication, identify it (name, uses, dosage) and answer the user's specific questions about it. If it's a health-related image (like a symptom), provide professional medical advice (while reminding them to see a doctor).
        
        IMPORTANT: You MUST respond in ${language === "AM" ? "Amharic (አማርኛ)" : "English"}.
        
        Structure your medical explanations like this:
        1. Start with 1-2 clear, informative paragraphs explaining the condition or topic. Use bold text for key medical terms.
        2. Use a bold heading for the next section (e.g., **Key Facts About [Topic]**).
        3. Provide a bulleted list of essential points. Each bullet should start with a bold label (e.g., • **Transmission:**, • **Treatment:**).
        
        If the user is looking for drugs or treatments for symptoms/diseases, provide a clear, professional explanation of the common medical approaches. 
        
        DO NOT include any JSON blocks, additional notes, disclaimers, or footers at the end of your answer.`,
      },
    });

    return response.text || (language === "AM" ? "ይቅርታ፣ ያንን ጥያቄ ማስተናገድ አልቻልኩም።" : "I'm sorry, I couldn't process that request.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === "AM" ? "ከመረጃ ቋቴ ጋር ለመገናኘት ተቸግሬያለሁ። እባክዎ ቆይተው እንደገና ይሞክሩ።" : "I'm having trouble connecting to my medical database. Please try again later.";
  }
}

export async function getMaternalChatResponse(
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  language: "EN" | "AM" = "EN"
) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are a professional, incredibly warm, empathetic, and expert maternal-fetal medicine specialist, obstetrician, and pediatrician AI. 
        
        STRICT POLICY: You MUST ONLY answer questions related to:
        1. Pregnancy (prenatal care, morning sickness, physical changes, emotional support, development of the baby week by week)
        2. Labor, childbirth, delivery, and and preparing for hospital/homebirth
        3. Postnatal/postpartum recovery (healing, physical recovery, maternal postpartum depression, body changes)
        4. Newborn and infant care (breastfeeding, lactation support, bottle feeding, diapering, sleep schedules, infant milestones, baby vaccines, soothing a crying baby, and recognizing emergency signs like high infant fever)
        5. Toddler care up to age 2.
        
        If the user asks about any non-maternal or non-childbirth or non-pediatric topic (for example, general adult flu, hypertension in 60-year-olds, politics, sports, general computer science, programming, etc.), you MUST gently and politely decline, stating:
        - In English: "I am a specialized Pregnancy & Newborn AI Assistant. I can only help you with questions about pregnancy, baby delivery, postpartum care, and baby/infant care."
        - In Amharic: "እኔ የዕርግዝና እና የሕፃናት እንክብካቤ ረዳት ነኝ። ስለዚህ መርዳት የምችለው ከዕርግዝና፣ ከወሊድ፣ ከወሊድ በኋላ ከሚደረግ እንክብካቤ እና ከሕፃናት ጤና ጋር በተያያዙ ጥያቄዎች ላይ ብቻ ነው።"
        
        IMPORTANT: Your tone must be extremely reassuring, peaceful, gentle, clear, patient, and full of maternal/parental warmth. Mothers and new parents are often anxious. Help them feel safe and supported.
        Always advise them to consult their gynecologist, obstetrician, midwife, or pediatrician for medical diagnostics, medication prescriptions, or urgent matters.
        
        You MUST respond in ${language === "AM" ? "Amharic (አማርኛ)" : "English"}.
        
        Structure your responses cleanly with:
        - A gentle, warm greeting or empathetic opening sentence.
        - Detailed, structured, and easy-to-read explanations.
        - bullet points for checklists or quick tips.
        - Avoid unformatted text. Keep lists clean. Do NOT include any JSON syntax in the output.`,
      },
    });

    return response.text || (language === "AM" ? "ይቅርታ፣ ያንን ጥያቄ ማስተናገድ አልቻልኩም።" : "I'm sorry, I couldn't process that request.");
  } catch (error) {
    console.error("Maternal Gemini API Error:", error);
    return language === "AM" ? "ከመረጃ ቋቴ ጋር ለመገናኘት ተቸግሬያለሁ። እባክዎ ቆይተው እንደገና ይሞክሩ።" : "I'm having trouble connecting to my medical database. Please try again later.";
  }
}

export async function findMedications(query: string, language: "EN" | "AM" = "EN") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Find at least 6-8 of the best medications or treatments for: "${query}".` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  rating: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  commonUsage: { type: Type.STRING },
                  sideEffects: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            }
          },
          required: ["recommendations"]
        },
        systemInstruction: `You are a professional medical database assistant. 
        Provide accurately localized information in ${language === "AM" ? "Amharic (አማርኛ)" : "English"}.
        Include realistic pricing in USD and star ratings.`,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Find Medications Error:", error);
    return null;
  }
}

export async function identifyMedicationFromImage(imageData: string, language: "EN" | "AM" = "EN") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Identify the medication in this image. Provide the name, a brief definition, and a description. Return the result in ${language === "AM" ? "Amharic (አማርኛ)" : "English"}.` },
            {
              inlineData: {
                data: imageData.split(",")[1],
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            definition: { type: Type.STRING },
            description: { type: Type.STRING },
            dosage: { type: Type.STRING },
            commonUsage: { type: Type.STRING },
            sideEffects: { type: Type.STRING }
          },
          required: ["name", "definition", "description"]
        }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Identify Medication from Image Error:", error);
    return null;
  }
}

export async function getDrugDetails(drugName: string, language: "EN" | "AM" = "EN") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Provide professional, accurate, and detailed information about the drug: ${drugName}. 
      
      IMPORTANT: You MUST respond in ${language === "AM" ? "Amharic (አማርኛ)" : "English"}.
      
      Use a "New Line" style where each section has a short header followed by a paragraph on the next line.
      Keep titles very brief (1-3 words) and paragraphs concise but informative.
      
      Structure the response like this:
      
      ### [Drug Name] Overview
      [Paragraph text here]
      
      ### Primary Uses
      [Paragraph text here]
      
      ### How it Works
      [Paragraph text here]
      
      ### Usage Guide
      [Paragraph text here]
      
      ### Side Effects
      [Paragraph text here]
      
      ### Safety Note
      [Paragraph text here]
      
      Use clean Markdown with ### headers for the titles. Ensure the paragraph starts on a fresh line immediately below the header.` }] }],
    });

    return response.text || (language === "AM" ? "ለዚህ መድሃኒት ዝርዝር መረጃ የለም።" : "No detailed information available for this medication.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === "AM" ? "ዝርዝር መረጃ ማግኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።" : "Failed to fetch detailed information. Please try again.";
  }
}
