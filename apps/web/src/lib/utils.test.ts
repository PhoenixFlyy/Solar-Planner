import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("cn_whenGivenConditionalClasses_keepsOnlyTruthy", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("cn_whenTailwindClassesConflict_lastWins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
