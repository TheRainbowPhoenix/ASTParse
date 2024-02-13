import {
  createToken,
  createTokenInstance,
  Lexer,
  IToken,
  TokenType,
} from "chevrotain";

function last<T>(arr: T[] | undefined) {
  if (Array.isArray(arr)) {
    return arr.slice(-1)[0];
  }
  return undefined;
}

export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z]\w*/,
});
export const Select = createToken({
  name: "Select",
  pattern: /SELECT/,
  longer_alt: Identifier,
});
export const From = createToken({
  name: "From",
  pattern: /FROM/,
  longer_alt: Identifier,
});
export const Where = createToken({
  name: "Where",
  pattern: /WHERE/,
  longer_alt: Identifier,
});

export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d*/ });
export const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });
export const LessThan = createToken({ name: "LessThan", pattern: /</ });
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
export const Newline = createToken({
  name: "Newline",
  line_breaks: true,
  start_chars_hint: ["\n", "\r"],
  pattern: /\n|\r\n?/,
});

function createTokenSet(primary: TokenType[]) {
  return [
    // primary tokens
    ...primary,
    // expressions
    GreaterThan,
    LessThan,
  ];
}

// The order is important for speed
export const allTokens = createTokenSet([
  // block lines

  // flow
  WhiteSpace,
  Newline,
  Comma,
  // keywords
  Select,
  From,
  Where,
  // Base keyword
  Identifier,
  // types
  Integer,
]);

export const scriptLexer = new Lexer(allTokens);

export function tokenize(text: string) {
  const lexResult = scriptLexer.tokenize(text);

  let lastToken = last(lexResult.tokens);
  if (!lastToken) {
    return lexResult;
  }

  // TODO: add Outdents

  // add final newline
  lastToken = last(lexResult.tokens);
  if (lastToken && lastToken.tokenType.name !== "Newline") {
    lexResult.tokens.push(
      createTokenInstance(
        Newline,
        "\n",
        lastToken.startOffset,
        lastToken.endOffset || NaN,
        lastToken.startLine ?? NaN,
        lastToken.endLine ?? NaN,
        lastToken.startColumn ?? NaN,
        lastToken.endColumn ?? NaN
      )
    );
  }
  return lexResult;
}
