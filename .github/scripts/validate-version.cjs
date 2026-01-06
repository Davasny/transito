#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple semver parser (no dependencies)
function parseSemver(version) {
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = version.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null,
  };
}

function compareSemver(v1, v2) {
  const parsed1 = parseSemver(v1);
  const parsed2 = parseSemver(v2);
  
  if (!parsed1 || !parsed2) {
    return null;
  }
  
  // Compare major.minor.patch
  if (parsed1.major !== parsed2.major) {
    return parsed1.major - parsed2.major;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor - parsed2.minor;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch - parsed2.patch;
  }
  
  // Both are same version - check prerelease
  // If one has prerelease and other doesn't, non-prerelease is greater
  if (parsed1.prerelease && !parsed2.prerelease) {
    return -1; // v1 is less (1.0.0-rc1 < 1.0.0)
  }
  if (!parsed1.prerelease && parsed2.prerelease) {
    return 1; // v1 is greater (1.0.0 > 1.0.0-rc1)
  }
  
  // Both have prerelease or both don't
  if (!parsed1.prerelease && !parsed2.prerelease) {
    return 0; // Equal
  }
  
  // Compare prerelease strings lexicographically
  if (parsed1.prerelease < parsed2.prerelease) {
    return -1;
  }
  if (parsed1.prerelease > parsed2.prerelease) {
    return 1;
  }
  
  return 0; // Equal
}

// Read arguments
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('::error::Usage: validate-version.cjs <new-version>');
  process.exit(1);
}

// Read current version from package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Validate: no 'v' prefix
if (newVersion.startsWith('v')) {
  console.error(`::error::Invalid semver format: ${newVersion} (remove 'v' prefix)`);
  process.exit(1);
}

// Validate: valid semver
if (!parseSemver(newVersion)) {
  console.error(`::error::Invalid semver: ${newVersion}`);
  process.exit(1);
}

// Validate: new version is greater than current
const comparison = compareSemver(newVersion, currentVersion);
if (comparison === null) {
  console.error(`::error::Failed to compare versions: ${newVersion} vs ${currentVersion}`);
  process.exit(1);
}

if (comparison <= 0) {
  console.error(`::error::New version (${newVersion}) must be greater than current version (${currentVersion})`);
  process.exit(1);
}

// Success
console.log(`✓ Version bump: ${currentVersion} -> ${newVersion}`);
process.exit(0);
