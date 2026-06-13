const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const directoryToScan = path.join(__dirname, '../app/[locale]');

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  const code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('useTranslations')) return;

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    return;
  }

  let modified = false;

  traverse(ast, {
    FunctionDeclaration(path) {
      handleFunctionLike(path);
    },
    ArrowFunctionExpression(path) {
      handleFunctionLike(path);
    },
    FunctionExpression(path) {
      handleFunctionLike(path);
    }
  });

  function handleFunctionLike(funcPath) {
    // Does this function contain a call to t()?
    let usesT = false;
    let hasTDecl = false;
    funcPath.traverse({
      CallExpression(callPath) {
        if (t.isIdentifier(callPath.node.callee, { name: 't' })) {
          usesT = true;
        }
      },
      VariableDeclarator(varPath) {
        if (t.isIdentifier(varPath.node.id, { name: 't' })) {
          hasTDecl = true;
        }
      }
    });

    if (usesT && !hasTDecl) {
      if (t.isBlockStatement(funcPath.node.body)) {
        const tDecl = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('t'),
            t.callExpression(t.identifier('useTranslations'), [t.stringLiteral('Common')])
          )
        ]);
        funcPath.node.body.body.unshift(tDecl);
        modified = true;
      }
    }
  }

  if (modified) {
    const output = generate(ast, {}, code);
    fs.writeFileSync(filePath, output.code, 'utf8');
    console.log(`Injected missing t declarations in: ${filePath}`);
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
console.log('Finished injecting useTranslations declarations.');
