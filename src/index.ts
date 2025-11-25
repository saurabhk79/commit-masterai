#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import * as dotenv from 'dotenv';
import clipboard from 'clipboardy';
import { getStagedDiff, hasStagedChanges } from './git.js';
import { generateCommitMessage } from './ai.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables from a .env file if present
dotenv.config();

async function main() {
  console.log(chalk.bold.blue('AI Commit Message Generator'));

  // Parse CLI flags
  const args = process.argv.slice(2);
  const shouldCommit = args.includes('--commit');
  const shouldPush = args.includes('--push');

  // 1. Check API Key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('\nError: OPENROUTER_API_KEY is missing.'));
    console.log(chalk.yellow('Please set it in your environment variables or a .env file.'));
    console.log(`export OPENROUTER_API_KEY="your_key_here"`);
    process.exit(1);
  }

  // 2. Check Git Status
  const staged = await hasStagedChanges();
  if (!staged) {
    console.log(chalk.yellow('\n No staged changes found.'));
    console.log('Run `git add <files>` before running this tool.');
    process.exit(0);
  }

  const spinner = ora('Reading git diff...').start();
  
  try {
    const diff = await getStagedDiff();
    if (!diff) {
      spinner.fail('Failed to read diff.');
      process.exit(1);
    }

    spinner.text = 'Analyzing changes with OpenRouter AI...';
    
    const message = await generateCommitMessage(apiKey, diff);
    await clipboard.write(`git commit -m '${message}'`);

    spinner.succeed('Commit message generated!');

    // If --commit is passed, create the commit automatically
    if (shouldCommit) {
      const safeMsg = message.replace(/\"/g, '\\\"');
      spinner.start('Creating git commit...');
      try {
        await execAsync(`git commit -m "${safeMsg}"`);
        spinner.succeed('Committed staged changes.');
      } catch (err) {
        spinner.fail('Failed to create git commit.');
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    }

    // If --push is passed, push the current branch to origin
    if (shouldPush) {
      spinner.start('Pushing current branch to origin...');
      try {
        const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD');
        const branch = branchStdout.trim();
        if (!branch) {
          throw new Error('Unable to determine current branch');
        }
        await execAsync(`git push origin ${branch}`);
        spinner.succeed(`Pushed ${branch} to origin.`);
      } catch (err) {
        spinner.fail('Failed to push to origin.');
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    }

    console.log('\n' + chalk.green('--------------------------------------------------'));
    console.log(message);
    console.log(chalk.green('--------------------------------------------------') + '\n');

    console.log(chalk.dim('To use this message:'));
    console.log(chalk.white(`git commit -m "${message.replace(/"/g, '\\"')}"`));

    console.log(chalk.dim('The commit message has also been copied to your clipboard.'));

  } catch (error) {
    spinner.fail('An error occurred.');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

main();
