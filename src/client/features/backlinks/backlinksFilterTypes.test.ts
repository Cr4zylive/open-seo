import { expect, it } from "vitest";
import {
  backlinksFilterBudgetError,
  EMPTY_BACKLINKS_FILTERS,
} from "./backlinksFilterTypes";

it("preserves seven saved conditions and offers recovery before a filtered request", () => {
  const values = { ...EMPTY_BACKLINKS_FILTERS, exclude: "a,b,c,d,e,f,g" };
  expect(backlinksFilterBudgetError(values, "subdomains", true)).toContain(
    "全部链接（含垃圾链接）",
  );
  expect(backlinksFilterBudgetError(values, "subdomains", false)).toBeNull();
});

it("accounts for subfolder conditions and accepts the exact remaining budget", () => {
  const values = { ...EMPTY_BACKLINKS_FILTERS, exclude: "a,b" };
  expect(backlinksFilterBudgetError(values, "subfolder", true)).toBeNull();
  expect(
    backlinksFilterBudgetError(
      { ...values, exclude: "a,b,c" },
      "subfolder",
      true,
    ),
  ).toContain("2 个条件上限");
});
