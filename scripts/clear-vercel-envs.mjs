import { execSync } from 'child_process';

const runCommand = (command) => {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
};

const main = async () => {
  console.log('Fetching environment variables...');
  const output = runCommand('npx vercel env ls');

  if (!output) {
    console.log('No output or error occurred.');
    return;
  }

  const lines = output.split('\n');
  const envVars = new Set();

  lines.forEach(line => {
    // Skip empty lines or headers
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('Vercel CLI')) return;
    if (trimmed.startsWith('>')) return; // Project info
    if (trimmed.startsWith('NAME')) return; // Header

    // Extract the first word (variable name)
    // The format is typically: NAME   ENVIRONMENTS   CREATED
    const parts = trimmed.split(/\s+/);
    if (parts.length > 0) {
      const name = parts[0];
      // Basic validation to ensure it looks like an env var (mostly uppercase, underscores)
      // Though some might differ, usually they are non-empty.
      // Ignore "Page" info if pagination exists (rare in simple output)
      if (name) {
        envVars.add(name);
      }
    }
  });

  const uniqueVars = Array.from(envVars);

  if (uniqueVars.length === 0) {
    console.log('No environment variables found to remove.');
    return;
  }

  console.log(`Found ${uniqueVars.length} environment variables.`);
  console.log('Removing variables...');

  for (const name of uniqueVars) {
    // Check if it's not some garbage text
    if (name === 'Retrieving' || name.includes('...')) continue;

    console.log(`Removing ${name}...`);
    // vercel env rm <name> -y removes it from all environments
    runCommand(`npx vercel env rm ${name} -y`);
  }

  console.log('Done.');
};

main();
