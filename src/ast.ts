import { CstNode, IToken } from "chevrotain";

import { tokenize } from "./lexer.ts";
import { parser } from "./parser.ts";
import { CodeNode, visitor } from "./visitor.ts";

export function compileAST(text: string): {
  errors?: any[];
  tokens?: IToken[];
  cst?: CstNode;
  ast?: CodeNode;
} {
  const tokens = tokenize(`${text}`);

  if (tokens.errors.length > 0) {
    return {
      errors: tokens.errors,
      tokens: [],
    };
  }

  console.info("tokens", tokens.tokens);

  parser.input = tokens.tokens;

  const cst = parser.program(); // base entrypoint, like program or select
  if (parser.errors.length > 0) {
    return {
      tokens: tokens.tokens,
      errors: parser.errors,
    };
  }

  console.info("cst", cst);

  const ast = visitor.visit(cst) as CodeNode;
  if (!ast) {
    return {
      tokens: tokens.tokens,
      cst,
      errors: ["no ast output"],
    };
  }

  // need this for code completion
  //   addRange(ast);

  return {
    tokens: tokens.tokens,
    cst,
    ast,
  };
}
