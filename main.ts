import { compileAST } from "./src/ast.ts";
import { compile } from "./src/generator.ts";
import { scriptLexer } from "./src/lexer.ts";
import { GENERATED_FILENAME } from "./src/transformer.ts";

import { tokenize } from "./src/lexer.ts";

let inputText = `SELECT column1 FROM table2 WHERE i < 0`;
// let lexingResult = scriptLexer.tokenize(inputText);
// console.log(lexingResult);

// console.log(compileAST(inputText));

const out = compile(inputText);
console.log(out);
if (out.source) {
  const encoder = new TextEncoder();
  const data = encoder.encode(out.source);

  Deno.writeFileSync(GENERATED_FILENAME, data);
}

if (out.map) {
  const encoder = new TextEncoder();
  const data = encoder.encode(out.map.toString());

  Deno.writeFileSync(`${GENERATED_FILENAME}.map`, data);
}

//eval'd() would be crazy - let's do this !

// const out = tokenize(inputText);
// console.log(out);

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
// if (import.meta.main) {
//   console.log("Add 2 + 3 =", add(2, 3));
// }
