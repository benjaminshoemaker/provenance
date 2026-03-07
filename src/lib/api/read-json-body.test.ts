import { describe, it, expect } from "vitest";
import { readJsonBody, ReadJsonBodyError } from "./read-json-body";

describe("readJsonBody", () => {
  it("should parse valid JSON body", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });

    const parsed = await readJsonBody(req, 1024);
    expect(parsed).toEqual({ hello: "world" });
  });

  it("should reject invalid JSON", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad json",
    });

    await expect(readJsonBody(req, 1024)).rejects.toEqual(
      expect.objectContaining<Partial<ReadJsonBodyError>>({
        status: 400,
      })
    );
  });

  it("should reject oversized body via content-length", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "9999",
      },
      body: JSON.stringify({ ok: true }),
    });

    await expect(readJsonBody(req, 1024)).rejects.toEqual(
      expect.objectContaining<Partial<ReadJsonBodyError>>({
        status: 413,
      })
    );
  });
});
