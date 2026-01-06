#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'validate-version.cjs');

function runTest(testName, version, shouldPass, currentVersion = '1.0.0-rc1') {
  // Temporarily modify package.json for testing
  const originalPkg = require('../../package.json');
  const testPkg = { ...originalPkg, version: currentVersion };
  const fs = require('fs');
  const pkgPath = path.join(__dirname, '../../package.json');
  
  // Backup original
  const originalContent = fs.readFileSync(pkgPath, 'utf8');
  
  try {
    // Write test version
    fs.writeFileSync(pkgPath, JSON.stringify(testPkg, null, 2));
    
    // Run script
    execSync(`node ${scriptPath} ${version}`, { stdio: 'pipe' });
    
    // If we got here, script passed
    if (shouldPass) {
      console.log(`✓ ${testName}`);
      return true;
    } else {
      console.log(`✗ ${testName} - Expected to fail but passed`);
      return false;
    }
  } catch (error) {
    // Script failed
    if (!shouldPass) {
      const errorMsg = error.stderr.toString().trim().split('\n')[0];
      console.log(`✓ ${testName} - ${errorMsg}`);
      return true;
    } else {
      console.log(`✗ ${testName} - Expected to pass but failed`);
      console.log(`  Error: ${error.stderr.toString().trim()}`);
      return false;
    }
  } finally {
    // Restore original
    fs.writeFileSync(pkgPath, originalContent);
  }
}

console.log('Running validate-version.cjs test suite');
console.log('========================================\n');

const tests = [
  {
    name: 'Valid bump: 1.0.0-rc1 -> 1.0.0-rc2',
    version: '1.0.0-rc2',
    current: '1.0.0-rc1',
    shouldPass: true,
  },
  {
    name: 'Valid bump: 1.0.0-rc1 -> 1.0.0-rc3 (skip rc2)',
    version: '1.0.0-rc3',
    current: '1.0.0-rc1',
    shouldPass: true,
  },
  {
    name: 'Valid bump: 1.0.0-rc1 -> 1.0.0 (promote to stable)',
    version: '1.0.0',
    current: '1.0.0-rc1',
    shouldPass: true,
  },
  {
    name: 'Valid bump: 0.1.0 -> 0.2.0',
    version: '0.2.0',
    current: '0.1.0',
    shouldPass: true,
  },
  {
    name: 'Valid bump: 1.0.0 -> 2.0.0',
    version: '2.0.0',
    current: '1.0.0',
    shouldPass: true,
  },
  {
    name: 'Invalid: Downgrade 1.0.0 -> 0.9.0',
    version: '0.9.0',
    current: '1.0.0',
    shouldPass: false,
  },
  {
    name: 'Invalid: Same version 1.0.0 -> 1.0.0',
    version: '1.0.0',
    current: '1.0.0',
    shouldPass: false,
  },
  {
    name: 'Invalid: v prefix (v2.0.0)',
    version: 'v2.0.0',
    current: '1.0.0',
    shouldPass: false,
  },
  {
    name: 'Invalid: Bad format (1.0)',
    version: '1.0',
    current: '1.0.0',
    shouldPass: false,
  },
  {
    name: 'Invalid: Bad format (1.0.0.0)',
    version: '1.0.0.0',
    current: '1.0.0',
    shouldPass: false,
  },
  {
    name: 'Invalid: Stable to pre-release 1.0.0 -> 1.0.0-rc1',
    version: '1.0.0-rc1',
    current: '1.0.0',
    shouldPass: false,
  },
  {
    name: 'Valid: Pre-release with different identifier rc1 -> beta1',
    version: '1.0.0-beta1',
    current: '1.0.0-alpha1',
    shouldPass: true,
  },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = runTest(test.name, test.version, test.shouldPass, test.current);
  if (result) {
    passed++;
  } else {
    failed++;
  }
}

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
