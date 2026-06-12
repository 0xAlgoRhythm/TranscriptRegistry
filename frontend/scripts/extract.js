const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const directoryToScan = path.join(__dirname, '../app/[locale]');
const enJsonPath = path.join(__dirname, '../messages/en.json');

// Read existing translations
let enDict = {};
if (fs.existsSync(enJsonPath)) {
  enDict = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
}

let newKeysAdded = 0;

function toCamelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has useTranslations to avoid double processing
  if (code.includes('useTranslations')) return;

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    console.error(`Failed to parse ${filePath}:`, e.message);
    return;
  }

  const componentNameMatch = filePath.match(/([a-zA-Z0-9_-]+)\/page\.tsx$/);
  let namespace = componentNameMatch ? componentNameMatch[1] : 'Common';
  namespace = namespace.charAt(0).toUpperCase() + namespace.slice(1);
  namespace = namespace.replace(/-/g, '');

  if (!enDict[namespace]) enDict[namespace] = {};

  let modified = false;
  let hasUseTranslations = false;

  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.trim();
      if (text && text.length > 1 && !/^[{}()[\];]+$/.test(text)) {
        // Generate a key
        let key = text.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 4).join('');
        key = key.charAt(0).toLowerCase() + key.slice(1);
        if (!key) key = `text${Object.keys(enDict[namespace]).length}`;

        enDict[namespace][key] = text;
        newKeysAdded++;
        modified = true;

        path.replaceWith(
          t.jsxExpressionContainer(
            t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
          )
        );
      }
    },
    // Also handle simple JSX attributes like placeholder
    JSXAttribute(path) {
      if (path.node.name.name === 'placeholder' && t.isStringLiteral(path.node.value)) {
        const text = path.node.value.value.trim();
        if (text) {
          let key = text.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 4).join('');
          key = key.charAt(0).toLowerCase() + key.slice(1);
          if (!key) key = `placeholder${Object.keys(enDict[namespace]).length}`;

          enDict[namespace][key] = text;
          newKeysAdded++;
          modified = true;

          path.node.value = t.jsxExpressionContainer(
            t.callExpression(t.identifier('t'), [t.stringLiteral(key)])
          );
        }
      }
    }
  });

  if (modified) {
    // Inject useTranslations import
    const importDecl = t.importDeclaration(
      [t.importSpecifier(t.identifier('useTranslations'), t.identifier('useTranslations'))],
      t.stringLiteral('next-intl')
    );
    ast.program.body.unshift(importDecl);

    // Inject const t = useTranslations('Namespace') inside the default export component
    traverse(ast, {
      ExportDefaultDeclaration(path) {
        const decl = path.node.declaration;
        if (t.isFunctionDeclaration(decl) || t.isArrowFunctionExpression(decl)) {
          const tDecl = t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('t'),
              t.callExpression(t.identifier('useTranslations'), [t.stringLiteral(namespace)])
            )
          ]);
          if (t.isBlockStatement(decl.body)) {
            decl.body.body.unshift(tDecl);
          }
        }
      }
    });

    const output = generate(ast, {}, code);
    fs.writeFileSync(filePath, output.code, 'utf8');
    console.log(`Processed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

walkDir(directoryToScan);
fs.writeFileSync(enJsonPath, JSON.stringify(enDict, null, 2), 'utf8');
console.log(`Extraction complete. Added ${newKeysAdded} new keys to en.json`);
