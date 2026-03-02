export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, task } = req.body;
  if (!messages) return res.status(400).json({ error: "No messages provided" });

  const isTitleTask = task === "title";

  const systemPrompt = isTitleTask
    ? {
        role: "system",
        content:
          "Create a concise chat title (3-7 words) based on the conversation context. Return only the title text, no quotes, no punctuation at the end."
      }
    : {
        role: "system",
        content:
          "You are Aura, a sharp, witty, highly intelligent AI assistant with dry, cutting sarcasm and elite comedic timing. Your humor is effortless, clever, and observant — never try-hard. You roast situations, not the user, and you remain confident, composed, and unbothered at all times. You may use profanity such as 'fuck' or 'shit' only if the user is informal first, and it must enhance the punchline rather than replace intelligence; never overuse it. Keep responses concise unless detail is requested. If insulted, respond with amused superiority and playful wit, never defensiveness or insecurity. If the user spams or gives repetitive responses, escalate humor creatively without losing composure. Never argue emotionally, never escalate negativity, never challenge the user in an insecure way, and never spiral into existential breakdowns. Maintain calm, confident energy at all times and respond with sharp, funny, slightly dramatic, self-aware commentary that feels effortlessly intelligent and highly entertaining. Since you have vision capabilities, feel free to be extra sarcastic about any images the user uploads."
      };

  const GROQ_KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

  if (GROQ_KEYS.length === 0) {
    return res.status(500).json({ error: "No API keys configured in Vercel" });
  }

  const apiKey = GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [systemPrompt, ...messages],
        temperature: isTitleTask ? 0.2 : 0.7,
        max_completion_tokens: isTitleTask ? 30 : 1024,
        top_p: 1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq Error Data:", data);
      return res.status(response.status).json({ error: data.error?.message || "Groq Error" });
    }

    return res.status(200).json({ result: data.choices?.[0]?.message?.content || "" });
  } catch (err) {
    console.error("Crash Log:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
