const SYSTEM_PROMPT = `
You are an expert developer using the Conventional Commits specification.
Review the provided git diff and generate a commit message.

STRICT RULES:
1. Output MUST be a SINGLE LINE. No body, no bullets, no explanations.
2. Format: <type>(<optional scope>): <description>
3. Types must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
4. Subject MUST be under 150 characters.
5. No markdown formatting. No code blocks. No quotes. No multi-line output.
6. Be brutally concise. Summarize the core change only.

Example output:
feat(auth): add google login
`;

export async function generateCommitMessage(
  apiKey: string,
  diff: string
): Promise<string> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "x-ai/grok-4.1-fast",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Here is the git diff to analyze:\n${diff}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`AI Generation failed: ${(error as Error).message}`);
  }
}
