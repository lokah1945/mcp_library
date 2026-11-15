export type ParsedArgs = { positional: string[]; flags: Map<string, string | true> };

/**
 * Parses CLI arguments of the form `--key value`, `--key=value`, and `--flag`.
 * Values may contain `=`; only the first `=` separates the key from the value.
 */
export function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith("--")) { if (arg) positional.push(arg); continue; }
    const body = arg.slice(2);
    const separator = body.indexOf("=");
    const rawKey = separator >= 0 ? body.slice(0, separator) : body;
    if (!rawKey) continue;
    if (separator >= 0) {
      flags.set(rawKey, body.slice(separator + 1));
      continue;
    }
    const next = args[index + 1];
    if (next && !next.startsWith("--")) { flags.set(rawKey, next); index += 1; }
    else flags.set(rawKey, true);
  }
  return { positional, flags };
}

export function has(args: ParsedArgs, key: string): boolean { return args.flags.has(key); }

export function value(args: ParsedArgs, key: string): string | undefined {
  const result = args.flags.get(key);
  return typeof result === "string" ? result : undefined;
}

export function required(args: ParsedArgs, key: string): string {
  const result = value(args, key);
  if (!result) throw new Error(`Missing --${key}.`);
  return result;
}

export function positiveNumber(args: ParsedArgs, key: string, fallback: number, maximum: number): number {
  const input = value(args, key);
  if (!input) return Math.min(fallback, maximum);
  const number = Number.parseInt(input, 10);
  if (!Number.isFinite(number) || number < 1) throw new Error(`--${key} must be a positive number.`);
  return Math.min(number, maximum);
}
