import { supabase } from '../supabaseClient';

export const callGeminiApi = async (prompt, overrideKey, overrideModel, retryCount = 0) => {
  const apiKey = overrideKey || localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
  const model = overrideModel || localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    })
  });

  if (!response.ok) {
    let rawError = '';
    try {
      const errJson = await response.json();
      rawError = errJson.error ? errJson.error.message : JSON.stringify(errJson);
    } catch(e) {}
    
    const errMsg = rawError ? `[API Error]: ${rawError}` : `(Status: ${response.status})`;
    
    if (response.status === 503) {
      if (retryCount < 3) {
         await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1))); // Exponential backoff
         return callGeminiApi(prompt, overrideKey, overrideModel, retryCount + 1);
      }
      throw new Error(`Server Gemini Error 503 setelah 3x percobaan. ${errMsg}`);
    } else if (response.status === 400 || response.status === 403) {
      throw new Error(`Error ${response.status}. ${errMsg}`);
    } else if (response.status === 404) {
      throw new Error(`Model tidak ditemukan (Error 404). ${errMsg}`);
    }
    throw new Error(`Gagal terhubung ke API Gemini. ${errMsg}`);
  }
  
  const resData = await response.json();
  return resData.candidates[0].content.parts[0].text;
};

// Versi tanpa responseMimeType — digunakan untuk generate laporan HTML murni
// agar Gemini tidak memaksa output dalam format JSON
export const callGeminiApiText = async (prompt, overrideKey, overrideModel, retryCount = 0) => {
  const apiKey = overrideKey || localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
  const model = overrideModel || localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
  
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 }, // tanpa responseMimeType
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    })
  });

  if (!response.ok) {
    let rawError = '';
    try {
      const errJson = await response.json();
      rawError = errJson.error ? errJson.error.message : JSON.stringify(errJson);
    } catch(e) {}
    const errMsg = rawError ? `[API Error]: ${rawError}` : `(Status: ${response.status})`;
    if (response.status === 503) {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
        return callGeminiApiText(prompt, overrideKey, overrideModel, retryCount + 1);
      }
      throw new Error(`Server Gemini Error 503 setelah 3x percobaan. ${errMsg}`);
    }
    throw new Error(`Gagal terhubung ke API Gemini. ${errMsg}`);
  }

  const resData = await response.json();
  return resData.candidates[0].content.parts[0].text;
};

export const saveAiReportToDb = async (id, content) => {
  try {
    const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
    const payloadContent = typeof content === 'string' ? content : JSON.stringify(content);
    if (useSupabase) {
      await supabase.from('ai_reports').upsert({ id, content: payloadContent });
    } else {
      await fetch('/api/ai-reports', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: payloadContent })
      });
    }
  } catch (e) {
    console.error(`Error saving report ${id} to DB:`, e);
  }
};

export const fetchAiReportFromDb = async (id) => {
  try {
    const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
    if (useSupabase) {
      const { data, error } = await supabase.from('ai_reports').select('content').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // not found
        throw error;
      }
      if (data && data.content) {
        try { return JSON.parse(data.content); } catch(e) { return data.content; }
      }
    } else {
      const res = await fetch(`/api/ai-reports/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.content) {
          try { return JSON.parse(json.data.content); } catch(e) { return json.data.content; }
        }
      }
    }
  } catch (e) {
    console.error(`Error fetching AI report ${id}:`, e);
  }
  return null;
};
