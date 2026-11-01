import { describe, expect, it } from "vitest";
import { getStandardErrorMessage } from "@/client/lib/error-messages";

describe("getStandardErrorMessage", () => {
  it("maps known error codes to standard copy", () => {
    expect(getStandardErrorMessage(new Error("PAYMENT_REQUIRED"))).toBe(
      "使用 OpenSEO 需要有效的托管订阅。",
    );
  });

  it("returns custom messages when the error is not a shared code", () => {
    expect(
      getStandardErrorMessage(new Error("Something failed: try again")),
    ).toBe("Something failed: try again");
  });
});
