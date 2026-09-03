const LOCAL_API_URL = '/api';

export async function generateCelebration(prompt: string, variantIndex = 1, previousMessages: string[] = []) {
  const response = await fetch(`${LOCAL_API_URL}/generate-celebration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      variant_index: variantIndex,
      previous_messages: previousMessages,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail?.message || result.detail?.reason || result.detail?.error || 'Failed to generate celebration');
  }

  return result.data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${LOCAL_API_URL}/health`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // If fetch throws, the server is unreachable
    return false;
  }
}
