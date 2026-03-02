export async function generateAIResponse(messages, modelMode = "Auto") {
  try {
    // 🔥 THE TRANSFORMER: This formats messages exactly how Groq Vision wants them
    const formattedMessages = messages.slice(-20).map(msg => {
      // If there are no images, send as a clean text message
      if (!msg.images || msg.images.length === 0) {
        return {
          role: msg.role,
          content: msg.content
        };
      }

      // If there ARE images, format for Llama 3.2 Vision
      return {
        role: msg.role,
        content: [
          { type: "text", text: msg.content || "" },
          ...msg.images.map(img => ({
            type: "image_url",
            image_url: { url: img.url || img } // Handles both object and string formats
          }))
        ]
      };
    });

    const response = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages: formattedMessages, 
        modelMode 
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data.result;

  } catch (error) {
    console.error("Aura API Call Failed:", error);
    return mockResponse(messages, modelMode);
  }
}
