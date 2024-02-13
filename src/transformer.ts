import { CodeWithSourceMap, SourceNode } from "source-map";
import { CodeNode, NODE } from "./visitor.ts";

export const GENERATED_FILENAME = "codegen.js";

export function write(
  ast: CodeNode,
  chunks: Array<string | SourceNode> | SourceNode | string
) {
  return new SourceNode(
    ast.startLine || 1,
    ast.startColumn || 1,
    GENERATED_FILENAME,
    chunks
  );
}

function blank(ast: CodeNode) {
  return write(ast, "");
}

function transformNode(ast: CodeNode): SourceNode {
  switch (ast.type) {
    case NODE.PROGRAM:
      return write(ast, [
        `try { // first-line\n`,
        `console.log("..:: START ::..");\n`,
        ...ast.lines
          .map((line, i) => [transformNode(line), `\n/* line: ${i} */`])
          .flat(),
        // TODO: CODE
        `} catch (e) {\n`,
        `debugger;\n`,
        `const err = new Error(e.message);\n`,
        `throw err;\n`,
        `}\n`,
        `//# sourceMappingURL=${GENERATED_FILENAME}.map`,
      ]);
    case NODE.SELECT_STMT: {
      const src = write(ast, [`/* Query Begins */\n`]);

      if (ast.whereClause) {
        // TODO: preshot conditions ?
      }

      src.add([`const query = new QueryBuilder();\n`, `const result = query`]);

      if (ast.selectClause) {
        src.add([transformNode(ast.selectClause), `\n\t`]);
      }

      if (ast.fromClause) {
        src.add([transformNode(ast.fromClause), `\n\t`]);
      }

      if (ast.whereClause) {
        src.add([transformNode(ast.whereClause), `\n\t`]);
        // TODO: preshot conditions ?
      }

      src.add(".execute();\n");

      return src;
    }
    case NODE.SELECT_CLAUSE:
      return write(ast, [
        `.select(${ast.columns.map((column) => `"${column}"`).join(", ")})`,
      ]);
    case NODE.FROM_CLAUSE:
      return write(ast, [`.from("${ast.table}")`]);
    case NODE.WHERE_CLAUSE: {
      const src = write(ast, [`.where([`]);

      src.add([transformNode(ast.condition)]);

      src.add("])");
      return src;
    }
    case NODE.EXPRESSION: {
      return write(ast, [`"${ast.lhs} ${ast.operator} ${ast.rhs}"`]);
    }

    default:
      console.error(`<unknown node>`, ast);
      return blank(ast);
  }
}

export type GenCtxCode = {
  ast?: CodeNode;
} & CodeWithSourceMap;

export function transformAst(ast: CodeNode): GenCtxCode {
  // translate into js
  const source = transformNode(ast);

  const output = source.toStringWithSourceMap({
    file: `${GENERATED_FILENAME}`,
  });

  return {
    ...output,
  };
}
