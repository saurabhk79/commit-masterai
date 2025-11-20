import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get the diff of staged changes.
 * We use --cached to only look at files added via 'git add'.
 */
export async function getStagedDiff(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git diff --cached');
    return stdout.trim();
  } catch (error) {
    console.error('Error reading git diff. Are you in a git repository?');
    return null;
  }
}

/**
 * Check if there are actually staged changes.
 */
export async function hasStagedChanges(): Promise<boolean> {
  const diff = await getStagedDiff();
  return !!diff && diff.length > 0;
}