const Module = require('module');
const { compilerOptions } = require('./ts-compiler-options');
const fs = require('fs');
const ts = require('typescript');

const extensions = Module._extensions;

extensions['.ts'] = function compileTS(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { ...compilerOptions, module: 1 },
    fileName: filename,
    reportDiagnostics: false,
  });
  if (filename.includes('database.ts')) console.log('Transpiled database.ts:', output.outputText);
  return module._compile(output.outputText, filename);
};

extensions['.tsx'] = extensions['.ts'];

module.exports = {
  compilerOptions,
};
