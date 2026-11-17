import { describe, expect, test } from "vitest";
import { normaliseText, buildSearchKeywords } from "../services/listings";

describe("listings search keyword builder", () => {
  test("strips Romanian diacritics and lowercases text", () => {
    expect(normaliseText("Ciorbă de Burtă în Timișoara")).toBe(
      "ciorba de burta in timisoara"
    );
  });

  test("splits title and description into unique normalized keywords", () => {
    const keywords = buildSearchKeywords(
      "TI-84 Plus Calculator!",
      "Scientific calculator for UPT exams."
    );
    expect(keywords).toContain("ti");
    expect(keywords).toContain("84");
    expect(keywords).toContain("calculator");
    expect(keywords).toContain("upt");
  });
});