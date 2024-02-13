import { CstNode, IToken } from "chevrotain";
import { SourceMapGenerator } from "source-map";
import { compileAST } from "./ast.ts";
import { CodeNode } from "./visitor.ts";
import { transformAst } from "./transformer.ts";

export type GeneratedBuild = {
  errors?: any[];
  tokens?: IToken[];
  cst?: CstNode;
  ast?: CodeNode;
  labels?: Record<string, number[]>;
  map?: SourceMapGenerator;
  source?: string;
};

export function compile(text: string): GeneratedBuild {
  const astResult = compileAST(text);

  if (astResult.errors && astResult.errors.length > 0) {
    return astResult;
  }

  if (!astResult.ast) {
    return {
      ...astResult,
      errors: ["AST output not found."],
    };
  }

  const transformResult = transformAst(astResult.ast);
  if (transformResult.code) {
    console.log(transformResult.code);
    try {
      return {
        ...astResult,
        ...transformResult,
        source: transformResult.code,
        // code: GeneratorFunction(transformResult.code)
      };
    } catch (error) {
      return {
        errors: [
          {
            message: error.message,
          },
        ],
        source: "error generating source",
        //   code: GeneratorFunction(' ')
      };
    }
  }

  return {
    ...astResult,
    source: "error.",
  };
}
