import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define directories and parameters
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const SRC_DIR = path.join(WORKSPACE_ROOT, 'src');

const LIMITS = {
  warnLines: 200,
  errLines: 300,
  warnStates: 3,
  errStates: 5,
};

// Check if src directory exists
if (!fs.existsSync(SRC_DIR)) {
  console.error(`\x1b[31mError: Source directory not found at ${SRC_DIR}\x1b[0m`);
  process.exit(1);
}

console.log('\n\x1b[34m====================================================\x1b[0m');
console.log('\x1b[1;34m      TripSplit Component Modularity Auditor        \x1b[0m');
console.log('\x1b[34m====================================================\x1b[0m');
console.log(`Scanning directory: \x1b[35m${SRC_DIR}\x1b[0m\n`);

// Helper to recursively find all .tsx files
function getTsxFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules or .git if somehow scanned
      if (file !== 'node_modules' && file !== '.git' && file !== '.agents') {
        getTsxFiles(filePath, filesList);
      }
    } else if (file.endsWith('.tsx')) {
      filesList.push(filePath);
    }
  }
  return filesList;
}

const tsxFiles = getTsxFiles(SRC_DIR);
let cleanCount = 0;
let warnCount = 0;
let violationCount = 0;

const auditResults = [];

// Audit each file
for (const file of tsxFiles) {
  const relativePath = path.relative(WORKSPACE_ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  
  // Calculate lines
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Audit State Hook usage (regex search for useState or useReducer)
  const useStateMatches = content.match(/useState\s*(<|\()/g) || [];
  const useReducerMatches = content.match(/useReducer\s*\(/g) || [];
  const stateHooksCount = useStateMatches.length + useReducerMatches.length;

  // Audit inline API/fetching logic
  const hasDirectApi = content.includes('api.') || content.includes('supabase.from') || content.includes('supabase.channel');
  const hasQueryHooks = content.includes('useQuery(') || content.includes('useMutation(') || content.includes('useQueryClient(');

  // Check structure anomalies
  const hasMobileDesktopDuplication = content.includes('lg:hidden') && (content.includes('lg:block') || content.includes('lg:flex') || content.includes('lg:table'));

  // Calculate scores and categories
  let status = 'CLEAN';
  const recommendations = [];

  if (lineCount >= LIMITS.errLines) {
    status = 'VIOLATION';
    recommendations.push(`File too large (${lineCount} lines). Break this component down into subcomponents.`);
  } else if (lineCount >= LIMITS.warnLines) {
    status = 'WARNING';
    recommendations.push(`File is growing (${lineCount} lines). Consider extracting auxiliary elements.`);
  }

  if (stateHooksCount >= LIMITS.errStates) {
    status = 'VIOLATION';
    recommendations.push(`Too many state hooks (${stateHooksCount}). Extract state and event handlers to a custom hook in 'hooks/'.`);
  } else if (stateHooksCount >= LIMITS.warnStates) {
    if (status !== 'VIOLATION') status = 'WARNING';
    recommendations.push(`Multiple states detected (${stateHooksCount}). Keep state thin, consider grouping into an object state.`);
  }

  if (hasDirectApi && hasQueryHooks && lineCount > 100) {
    if (status !== 'VIOLATION') status = 'WARNING';
    recommendations.push(`Contains inline TanStack Query and API services in a rendering file. Extract logic to a dedicated feature custom hook.`);
  }

  if (hasMobileDesktopDuplication && lineCount > 150) {
    recommendations.push(`Detects extensive mobile & desktop layouts combined. Split into separate views (e.g., *Mobile.tsx and *Desktop.tsx) to improve legibility.`);
  }

  // Count summary
  if (status === 'CLEAN') cleanCount++;
  else if (status === 'WARNING') warnCount++;
  else if (status === 'VIOLATION') violationCount++;

  auditResults.push({
    file: relativePath,
    lineCount,
    stateHooksCount,
    hasDirectApi,
    status,
    recommendations,
  });
}

// Sort results: Violations first, then Warnings, then Clean
auditResults.sort((a, b) => {
  const statusWeight = { VIOLATION: 3, WARNING: 2, CLEAN: 1 };
  if (statusWeight[a.status] !== statusWeight[b.status]) {
    return statusWeight[b.status] - statusWeight[a.status];
  }
  return b.lineCount - a.lineCount;
});

// Print detailed logs
for (const res of auditResults) {
  if (res.status === 'CLEAN') continue; // only show warnings and violations in detail to avoid cluttering

  const color = res.status === 'VIOLATION' ? '\x1b[1;31m[VIOLATION]\x1b[0m' : '\x1b[1;33m[WARNING]\x1b[0m';
  console.log(`${color} \x1b[1m${res.file}\x1b[0m`);
  console.log(`   Lines: \x1b[36m${res.lineCount}\x1b[0m (Max: ${LIMITS.errLines}) | State Hooks: \x1b[36m${res.stateHooksCount}\x1b[0m (Max: ${LIMITS.errStates})`);
  
  if (res.recommendations.length > 0) {
    console.log('   Recommendations:');
    for (const rec of res.recommendations) {
      console.log(`     \x1b[33m- ${rec}\x1b[0m`);
    }
  }
  console.log('');
}

// Summary block
console.log('\x1b[34m====================================================\x1b[0m');
console.log('\x1b[1;34m                 Audit Summary                      \x1b[0m');
console.log('\x1b[34m====================================================\x1b[0m');
console.log(`Total audited TSX components: \x1b[1m${tsxFiles.length}\x1b[0m`);
console.log(`  \x1b[32mClean Components:          ${cleanCount}\x1b[0m`);
console.log(`  \x1b[33mWarnings (Need attention):  ${warnCount}\x1b[0m`);
console.log(`  \x1b[31mViolations (Refactor now):  ${violationCount}\x1b[0m`);
console.log('\x1b[34m====================================================\x1b[0m\n');

if (violationCount > 0) {
  console.log('\x1b[31mAction Required: Refactor violating files to maintain clean modular folder structures.\x1b[0m\n');
} else {
  console.log('\x1b[32mGreat job! Frontend files conform to component modularity standards.\x1b[0m\n');
}
