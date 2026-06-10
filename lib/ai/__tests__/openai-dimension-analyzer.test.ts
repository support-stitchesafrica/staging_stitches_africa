import { describe, it, expect } from "vitest";
import { isOpenAIUnavailableError } from "../openai-dimension-analyzer";

describe("isOpenAIUnavailableError", () => {
  it("detects rate limit", () => {
    expect(isOpenAIUnavailableError({ status: 429 })).toBe(true);
  });

  it("detects quota errors", () => {
    expect(
      isOpenAIUnavailableError({ code: "insufficient_quota" })
    ).toBe(true);
  });

  it("does not treat validation errors as unavailable", () => {
    expect(isOpenAIUnavailableError({ status: 400 })).toBe(false);
  });
});
