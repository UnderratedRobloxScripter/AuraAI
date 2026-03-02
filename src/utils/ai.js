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

export async function generateChatTitle(messages) {
  try {
    const contextMessages = messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .slice(-6)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    if (contextMessages.length === 0) {
      return "New Chat";
    }

    const response = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: contextMessages,
        task: "title"
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

    const rawTitle = (data.result || "").replace(/["'`]/g, "").trim();
    if (!rawTitle) return "New Chat";

    return rawTitle.length > 60 ? `${rawTitle.slice(0, 57)}...` : rawTitle;
  } catch (error) {
    console.error("Chat title generation failed:", error);

    const firstUserMessage = messages.find((msg) => msg.role === "user")?.content || "";
    if (!firstUserMessage) return "New Chat";
    return firstUserMessage.length > 40 ? `${firstUserMessage.slice(0, 37)}...` : firstUserMessage;
  }
}
