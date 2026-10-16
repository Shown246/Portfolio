export type ChatMessage = { role: 'user' | 'ai'; text: string };

export async function sendMessage(message: string, history: ChatMessage[]): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) return "Something went wrong — try again.";
    const data = (await res.json()) as { reply?: string };
    return data.reply ?? "Something went wrong — try again.";
  } catch {
    return "Network hiccup — try again.";
  }
}
