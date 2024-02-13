import {
  CstNode,
  CstParser,
  IRuleConfig,
  IToken,
  ParserMethod,
} from "chevrotain";
import { IS_DEV } from "./consts.ts";
import { allTokens } from "./lexer.ts";
import * as l from "./lexer.ts";

const highlight = ["Command", "block"];

class ScriptParser extends CstParser {
  constructor() {
    super(allTokens, {
      maxLookahead: 2,
      traceInitPerf: IS_DEV,
      skipValidations: !IS_DEV,
      recoveryEnabled: !IS_DEV,
    });

    this.performSelfAnalysis();
  }

  RULER<F extends () => void>(
    name: string,
    implementation: F,
    config?: IRuleConfig<CstNode>
  ): ParserMethod<Parameters<F>, CstNode> {
    const isBold = highlight.some((check) => name.includes(check));
    return this.RULE(
      name,
      () => {
        // TODO: tracing here + indent + if isBold
        implementation();
      },
      config
    );
  }

  program = this.RULER("program", () => {
    this.MANY(() => this.SUBRULE(this.code_line));
  });

  code_line = this.RULER("code_line", () => {
    this.OPTION(() => this.SUBRULE(this.selectStatement));
    this.AT_LEAST_ONE(() => this.CONSUME(l.Newline));
  });

  selectStatement = this.RULER("selectStatement", () => {
    this.SUBRULE(this.selectClause);
    this.SUBRULE(this.fromClause);
    this.OPTION(() => {
      this.SUBRULE(this.whereClause);
    });
  });

  selectClause = this.RULER("selectClause", () => {
    this.CONSUME(l.Select);
    this.AT_LEAST_ONE_SEP({
      SEP: l.Comma,
      DEF: () => {
        this.CONSUME(l.Identifier);
      },
    });
  });

  fromClause = this.RULE("fromClause", () => {
    this.CONSUME(l.From);
    this.CONSUME(l.Identifier);
  });

  whereClause = this.RULE("whereClause", () => {
    this.CONSUME(l.Where);
    this.SUBRULE(this.expression);
  });

  expression = this.RULE("expression", () => {
    this.SUBRULE(this.atomicExpression, { LABEL: "lhs" });
    this.SUBRULE(this.relationalOperator);
    this.SUBRULE2(this.atomicExpression, { LABEL: "rhs" }); // note the '2' suffix to distinguish
    // from the 'SUBRULE(atomicExpression)'
    // 2 lines above.
  });

  atomicExpression = this.RULE("atomicExpression", () => {
    this.OR([
      { ALT: () => this.CONSUME(l.Integer) },
      { ALT: () => this.CONSUME(l.Identifier) },
    ]);
  });

  relationalOperator = this.RULE("relationalOperator", () => {
    this.OR([
      { ALT: () => this.CONSUME(l.GreaterThan) },
      { ALT: () => this.CONSUME(l.LessThan) },
    ]);
  });
}

export const parser = new ScriptParser();
