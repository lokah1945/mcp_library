import { describe, expect, it } from "vitest";
import { has, parseArgs, positiveNumber, required, value } from "../apps/worker/src/lib/cli-args";

describe("worker CLI argument parsing", () => {
  it("keeps values that contain '=' intact", () => {
    const args = parseArgs(["--query=a=b", "--dir", "/tmp/path=with=equals", "--updated-since=2026-01-01T00:00:00Z"]);
    expect(value(args, "query")).toBe("a=b");
    expect(value(args, "dir")).toBe("/tmp/path=with=equals");
    expect(value(args, "updated-since")).toBe("2026-01-01T00:00:00Z");
  });

  it("separates positional commands, boolean flags, and consumed values", () => {
    const args = parseArgs(["providers:sync", "--all", "--limit", "25", "--search", "playwright"]);
    expect(args.positional).toEqual(["providers:sync"]);
    expect(has(args, "all")).toBe(true);
    expect(value(args, "all")).toBeUndefined();
    expect(value(args, "limit")).toBe("25");
    expect(value(args, "search")).toBe("playwright");
  });

  it("does not consume a following flag as a value", () => {
    const args = parseArgs(["library:list", "--limit", "--all"]);
    expect(has(args, "limit")).toBe(true);
    expect(has(args, "all")).toBe(true);
  });

  it("requires a value for required flags", () => {
    const args = parseArgs(["providers:import-mcpmarket-sitemaps"]);
    expect(() => required(args, "dir")).toThrow(/Missing --dir/);
  });

  it("clamps positive numbers to the configured maximum, including the fallback", () => {
    const args = parseArgs(["providers:sync-glama", "--max-pages", "5"]);
    expect(positiveNumber(args, "max-pages", 25, 100)).toBe(5);
    expect(positiveNumber(parseArgs(["x"]), "max-pages", Number.MAX_SAFE_INTEGER, 100000)).toBe(100000);
    expect(() => positiveNumber(parseArgs(["x", "--limit", "0"]), "limit", 25, 100)).toThrow(/positive number/);
    expect(() => positiveNumber(parseArgs(["x", "--limit", "abc"]), "limit", 25, 100)).toThrow(/positive number/);
  });
});
