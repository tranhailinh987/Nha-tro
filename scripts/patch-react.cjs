const fs = require('fs');
const path = require('path');

const targetFiles = [
  'node_modules/react-dom/cjs/react-dom-client.development.js',
  'node_modules/react-dom/cjs/react-dom-profiling.development.js',
  'node_modules/.vite/deps/react-dom_client.js'
];

let patchedCount = 0;

for (const relPath of targetFiles) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // 1. Patch readReactElementTypeof to safely catch SecurityError on cross-origin objects
  if (content.includes('function readReactElementTypeof(value)') && !content.includes('/* patched-cross-origin */')) {
    content = content.replace(
      /function readReactElementTypeof\(value\)\s*\{[\s\S]*?return\s+["']\$\$typeof["']\s+in\s+value[\s\S]*?: void 0;\s*\}/g,
      `function readReactElementTypeof(value) { /* patched-cross-origin */
      try {
        return "$$typeof" in value && hasOwnProperty.call(value, "$$typeof")
          ? value.$$typeof
          : void 0;
      } catch (e) {
        return void 0;
      }
    }`
    );
    changed = true;
  }

  // 2. Wrap property iteration in addObjectToProperties with try-catch
  if (content.includes('function addObjectToProperties') && !content.includes('/* patched-add-object */')) {
    content = content.replace(
      /(function addObjectToProperties\(object,\s*properties,\s*indent,\s*prefix\)\s*\{[\s\S]*?for\s*\(\w+\s+in\s+object\)\s*)(if\s*\([\s\S]*?OBJECT_WIDTH_LIMIT\s*\)\s*;\s*break;\s*\})/g,
      `$1try { /* patched-add-object */ $2 } catch (e) {}`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    patchedCount++;
    console.log(`[patch-react] Successfully patched ${relPath}`);
  }
}

console.log(`[patch-react] Completed patching ${patchedCount} files.`);
