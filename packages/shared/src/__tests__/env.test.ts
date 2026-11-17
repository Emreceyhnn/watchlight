import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireEnv } from "../env";

describe("requireEnv", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.TEST_PRESENT_A = "value-a";
    process.env.TEST_PRESENT_B = "value-b";
    delete process.env.TEST_MISSING;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("does nothing when all required variables are set", () => {
    expect(() => requireEnv(["TEST_PRESENT_A", "TEST_PRESENT_B"])).not.toThrow();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it("exits with code 1 and names the missing variables", () => {
    expect(() => requireEnv(["TEST_PRESENT_A", "TEST_MISSING"])).toThrow("process.exit called");

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("TEST_MISSING"));
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining("TEST_PRESENT_A"));
  });

  it("treats an empty string as missing", () => {
    process.env.TEST_PRESENT_A = "";

    expect(() => requireEnv(["TEST_PRESENT_A"])).toThrow("process.exit called");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("TEST_PRESENT_A"));
  });
});
