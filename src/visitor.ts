import {
  CstChildrenDictionary,
  CstElement,
  CstNode,
  CstNodeLocation,
  IToken,
} from "chevrotain";
import { parser } from "./parser.ts";
import { IS_DEV } from "./consts.ts";

const CstVisitor = parser.getBaseCstVisitorConstructor();

export enum NODE {
  PROGRAM,
  SELECT_CLAUSE,
  SELECT_STMT,
  FROM_CLAUSE,
  WHERE_CLAUSE,
  EXPRESSION,
  TEXT,
}

function asList(thing: ScriptVisitor, node: CstNode[] | undefined): CodeNode[] {
  return (
    node?.map((item) => thing.visit(item)).filter((item) => item) || []
  ).flat();
}

type CodeNodeData =
  | {
      type: NODE.PROGRAM;
      lines: any[];
    }
  | {
      type: NODE.SELECT_CLAUSE; // NODE.SELECT_CLAUSE
      columns: any[];
    }
  | {
      type: NODE.SELECT_STMT;
      selectClause: any;
      fromClause: any;
      whereClause: any;
    }
  | {
      type: NODE.FROM_CLAUSE;
      table: any;
    }
  | {
      type: NODE.WHERE_CLAUSE;
      condition: any;
    }
  | {
      type: NODE.EXPRESSION;
      lhs: any;
      operator: any;
      rhs: any;
    };

export type CodeNode = CodeNodeData & CstNodeLocation;

function isToken(obj: CstNode | IToken): obj is IToken {
  return (obj as IToken)?.tokenType ? true : false;
}

function getLocation(obj: CstChildrenDictionary): CstNodeLocation {
  const locations = Object.values(obj)
    .flat()
    .filter((item) => !!item)
    .map((item) => {
      if (item && isToken(item)) {
        return {
          startLine: item.startLine,
          startColumn: item.startColumn,
          startOffset: item.startOffset,
          endLine: item.endLine,
          endColumn: item.endColumn,
          endOffset: item.endOffset,
        };
      }
      if (item.location) {
        return {
          ...item.location,
        };
      }

      return {
        startLine: 0,
        startColumn: 0,
        startOffset: 0,
        endLine: 0,
        endColumn: 0,
        endOffset: 0,
      };
    })
    .filter((item) => {
      return item.startLine !== 0 && item.endLine !== 0;
    });

  return {
    startLine: Math.min(...locations.map((item) => item.startLine || 1)),
    startColumn: Math.min(...locations.map((item) => item.startColumn || 1)),
    startOffset: Math.min(...locations.map((item) => item.startOffset || 1)),
    endLine: Math.max(...locations.map((item) => item.endLine || 1)),
    endColumn: Math.max(...locations.map((item) => item.endColumn || 1)),
    endOffset: Math.max(...locations.map((item) => item.endOffset || 1)),
  };
}

function makeNode(ctx: CstChildrenDictionary, node: CodeNodeData): CodeNode {
  return {
    // parent: undefined,
    ...node,
    ...getLocation(ctx),
  };
}

class ScriptVisitor extends CstVisitor {
  constructor() {
    super();

    if (IS_DEV) {
      this.validateVisitor();
    }
  }

  program(ctx: CstChildrenDictionary): CodeNode {
    return makeNode(ctx, {
      type: NODE.PROGRAM,
      // @ts-expect-error cst element
      lines: asList(this, ctx.code_line),
    });
  }

  code_line(ctx: CstChildrenDictionary): CodeNode {
    // @ts-expect-error cst expression
    return this.visit(ctx.selectStatement);
  }

  selectClause(ctx: CstChildrenDictionary): CodeNode {
    // Each Terminal or Non-Terminal in a grammar rule are collected into
    // an array with the same name(key) in the ctx object.
    let columns = ctx.Identifier.map((identToken: any) => identToken.image);

    return makeNode(ctx, {
      type: NODE.SELECT_CLAUSE, // NODE.SELECT_CLAUSE
      columns: columns,
    });
  }

  fromClause(ctx: CstChildrenDictionary): CodeNode {
    // @ts-expect-error cst image
    const tableName = ctx.Identifier[0].image;

    return makeNode(ctx, {
      type: NODE.FROM_CLAUSE,
      table: tableName,
    });
  }

  whereClause(ctx: CstChildrenDictionary): CodeNode {
    // @ts-expect-error cst expression
    const condition = this.visit(ctx.expression);

    return makeNode(ctx, {
      type: NODE.WHERE_CLAUSE,
      condition: condition,
    });
  }

  selectStatement(ctx: CstChildrenDictionary): CodeNode {
    // "this.visit" can be used to visit none-terminals and will invoke the correct visit method for the CstNode passed.
    // @ts-expect-error cst element
    let select = this.visit(ctx.selectClause);

    //  "this.visit" can work on either a CstNode or an Array of CstNodes.
    //  If an array is passed (ctx.fromClause is an array) it is equivalent
    //  to passing the first element of that array
    // @ts-expect-error cst element
    let from = this.visit(ctx.fromClause);

    // "whereClause" is optional, "this.visit" will ignore empty arrays (optional)
    // @ts-expect-error cst element
    let where = this.visit(ctx.whereClause);

    return makeNode(ctx, {
      type: NODE.SELECT_STMT,
      selectClause: select,
      fromClause: from,
      whereClause: where,
    });
  }

  expression(ctx: CstChildrenDictionary): CodeNode {
    // Note the usage of the "rhs" and "lhs" labels defined in step 2 in the expression rule.
    // @ts-expect-error cst element
    const lhs = this.visit(ctx.lhs[0]);
    // @ts-expect-error cst element
    const operator = this.visit(ctx.relationalOperator);
    // @ts-expect-error cst element
    const rhs = this.visit(ctx.rhs[0]);

    return makeNode(ctx, {
      type: NODE.EXPRESSION,
      lhs: lhs,
      operator: operator,
      rhs: rhs,
    });
  }

  // these two visitor methods will return a string.
  atomicExpression(ctx: CstChildrenDictionary): CodeNode {
    if (ctx.Integer) {
      // @ts-expect-error cst element
      return ctx.Integer[0].image;
    } else {
      // @ts-expect-error cst element
      return ctx.Identifier[0].image;
    }
  }

  relationalOperator(ctx: CstChildrenDictionary): CodeNode {
    if (ctx.GreaterThan) {
      // @ts-expect-error cst element
      return ctx.GreaterThan[0].image;
    } else {
      // @ts-expect-error cst element
      return ctx.LessThan[0].image;
    }
  }
}

export const visitor = new ScriptVisitor();
