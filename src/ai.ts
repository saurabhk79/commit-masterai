import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are an expert developer using the Conventional Commits specification.
Review the provided git diff and generate a commit message.

Rules:
1. Format: <type>(<optional scope>): <description>
2. Types must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
3. Keep the subject line under 50 characters.
4. If the changes are complex, provide a bulleted body explaining "why" and "what".
5. Do NOT use markdown code blocks (like \`\`\`) in the output. Just raw text.
6. Be concise.

Example:
feat(auth): implement login with google

- Added OAuth2 provider config
- Updated user schema to support external IDs
`;

export async function generateCommitMessage(
  apiKey: string,
  diff: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Using 'gemini-1.5-flash' as it is fast and cheap/free for this use case
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
${SYSTEM_PROMPT}

Here is the git diff to analyze:
${diff}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    throw new Error(`AI Generation failed: ${(error as Error).message}`);
  }
}
