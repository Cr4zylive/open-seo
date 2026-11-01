import { describe, expect, it } from "vitest";
import { extractProxyJsonText } from "./compatibleJsonOutput";

describe("extractProxyJsonText", () => {
  it("keeps a JSON object that already parses", () => {
    expect(extractProxyJsonText('  {"topic":"seo"}  ')).toBe('{"topic":"seo"}');
  });

  it("unwraps a json fence that is the whole reply", () => {
    expect(extractProxyJsonText('```json\n{"topic":"rank tracker"}\n```')).toBe(
      '{"topic":"rank tracker"}',
    );
  });

  it("pulls the object out of prose and a fence", () => {
    const reply = [
      "Here is the draft:",
      "",
      "```json",
      '{"topic":"rank tracker","prompts":["which tool?"]}',
      "```",
      "Let me know if you want changes.",
    ].join("\n");

    expect(extractProxyJsonText(reply)).toBe(
      '{"topic":"rank tracker","prompts":["which tool?"]}',
    );
  });

  it("keeps braces that sit inside a string", () => {
    const reply = 'Note: {"label":"use } and { carefully"} trailing';
    expect(extractProxyJsonText(reply)).toBe(
      '{"label":"use } and { carefully"}',
    );
  });

  it("prefers the outer object over a nested one", () => {
    const reply = 'prefix {"topic":"seo","meta":{"n":1}} suffix';
    expect(extractProxyJsonText(reply)).toBe('{"topic":"seo","meta":{"n":1}}');
  });

  it("leaves a markdown code sample that is not JSON alone", () => {
    const sample = "```ts\nconst x = 1;\n```";
    expect(extractProxyJsonText(sample)).toBe(sample);
  });

  it("leaves prose that has no JSON value", () => {
    expect(extractProxyJsonText("I cannot return JSON.")).toBe(
      "I cannot return JSON.",
    );
  });
});
