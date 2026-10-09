process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

// Parse command line arguments: node scripts/git-push.js <repoUrl> <token>
const repoUrl = process.argv[2];
const token = process.argv[3];

if (!repoUrl) {
  console.error('Usage: node scripts/git-push.js <remoteRepoUrl> [personalAccessToken]');
  process.exit(1);
}

const dir = process.cwd();

async function run() {
  console.log('📦 Initializing Git repository...');
  try {
    await git.init({ fs, dir });
  } catch (err) {
    console.log('Git repo already initialized or init warning:', err.message);
  }

  // Read .gitignore and determine files to add
  console.log('📄 Staging files (ignoring files in .gitignore)...');
  
  // Custom recursive file walker respecting .gitignore rules
  function getTrackableFiles(baseDir, currentDir = '') {
    const fullCurrent = path.join(baseDir, currentDir);
    const entries = fs.readdirSync(fullCurrent, { withFileTypes: true });
    let results = [];

    const ignoredNames = new Set([
      'node_modules',
      '.git',
      '.env',
      '.env.local',
      'dist',
      'build',
      '.vercel',
      '.system_generated',
    ]);

    for (const entry of entries) {
      if (ignoredNames.has(entry.name) || entry.name.startsWith('.env')) {
        continue;
      }

      const relPath = currentDir ? path.join(currentDir, entry.name).replace(/\\/g, '/') : entry.name;

      if (entry.isDirectory()) {
        results = results.concat(getTrackableFiles(baseDir, relPath));
      } else {
        results.push(relPath);
      }
    }
    return results;
  }

  const filesToAdd = getTrackableFiles(dir);
  console.log(`Found ${filesToAdd.length} files to track.`);

  for (const filepath of filesToAdd) {
    await git.add({ fs, dir, filepath });
  }

  console.log('✍️ Creating commit...');
  let sha;
  try {
    sha = await git.commit({
      fs,
      dir,
      author: {
        name: 'DG Tech Admin',
        email: 'admin@dgtech.com',
      },
      message: 'Production Ready: DG Tech Offsite 2.0 Attendance & Vehicle Tracking',
    });
    console.log(`✅ Committed successfully with SHA: ${sha}`);
  } catch (err) {
    console.log('Commit note:', err.message);
  }

  console.log(`🚀 Pushing to remote: ${repoUrl}...`);
  try {
    await git.push({
      fs,
      http,
      dir,
      url: repoUrl,
      remoteRef: 'refs/heads/main',
      force: true,
      onAuth: () => {
        if (token) {
          return { username: token, password: '' };
        }
        return {};
      },
    });
    console.log('🎉 Successfully pushed to GitHub main branch!');
  } catch (pushErr) {
    console.error('❌ Push error:', pushErr.message);
    process.exit(1);
  }
}

run();
