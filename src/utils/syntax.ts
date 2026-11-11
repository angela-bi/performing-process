import { parser } from '@lezer/javascript';

// returns the 1-based line of the first syntax error, or null if the code parses
export function findSyntaxError(code: string): number | null {
  let errorPos = -1;
  parser.parse(code).iterate({
    enter(node) {
      if (errorPos >= 0) return false;       // already found one, skip the rest
      if (node.type.isError) {
        errorPos = node.from;
        return false;
      }
    },
  });
  if (errorPos < 0) return null;
  return code.slice(0, errorPos).split('\n').length;
}