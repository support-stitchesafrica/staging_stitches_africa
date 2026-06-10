import { describe, it, expect } from "vitest";
import {
  isVisionImageUrl,
  mergeProductImageSources,
} from "../vision-image-urls";

describe("vision-image-urls", () => {
  it("accepts https and data URLs", () => {
    expect(isVisionImageUrl("https://cdn.example.com/a.jpg")).toBe(true);
    expect(isVisionImageUrl("data:image/jpeg;base64,abc")).toBe(true);
  });

  it("rejects blob and localhost", () => {
    expect(isVisionImageUrl("blob:http://localhost/x")).toBe(false);
    expect(isVisionImageUrl("http://localhost:3001/img.jpg")).toBe(false);
  });

  it("prefers remote URLs over blob previews", () => {
    const merged = mergeProductImageSources(
      ["https://storage.example.com/p.jpg"],
      ["blob:http://localhost/abc"]
    );
    expect(merged).toEqual(["https://storage.example.com/p.jpg"]);
  });

  it("falls back to previews when no remote URLs", () => {
    const merged = mergeProductImageSources(
      [],
      ["blob:http://localhost/abc"]
    );
    expect(merged).toEqual(["blob:http://localhost/abc"]);
  });
});
