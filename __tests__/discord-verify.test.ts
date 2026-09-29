import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign as edSign, type KeyObject } from "node:crypto";
import { POST } from "@/app/api/discord/route";

function toRawPublicKeyHex(publicKey: KeyObject): string {
  // Ed25519 SPKI DER encoding ends with the 32-byte raw public key,
  // which is the format Discord's DISCORD_PUBLIC_KEY uses.
  const der = publicKey.export({ type: "spki", format: "der" });
  return der.subarray(der.length - 32).toString("hex");
}

function signInteraction(
  privateKey: KeyObject,
  timestamp: string,
  body: string
): string {
  const message = Buffer.from(timestamp + body, "utf8");
  return edSign(null, message, privateKey).toString("hex");
}

function buildRequest(
  body: string,
  headers: Record<string, string>
): Request {
  return new Request("http://localhost/api/discord", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("POST /api/discord signature verification", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyHex = toRawPublicKeyHex(publicKey);

  it("유효한 서명의 PING 요청은 PONG으로 응답한다", async () => {
    process.env.DISCORD_PUBLIC_KEY = publicKeyHex;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({ type: 1 });
    const signature = signInteraction(privateKey, timestamp, body);

    const response = await POST(
      buildRequest(body, {
        "x-signature-ed25519": signature,
        "x-signature-timestamp": timestamp,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ type: 1 });
  });

  it("서명이 잘못된 요청은 401을 반환한다", async () => {
    process.env.DISCORD_PUBLIC_KEY = publicKeyHex;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({ type: 1 });

    const response = await POST(
      buildRequest(body, {
        "x-signature-ed25519": "00".repeat(64),
        "x-signature-timestamp": timestamp,
      })
    );

    expect(response.status).toBe(401);
  });

  it("서명 헤더가 누락된 요청은 401을 반환한다", async () => {
    process.env.DISCORD_PUBLIC_KEY = publicKeyHex;

    const body = JSON.stringify({ type: 1 });

    const response = await POST(buildRequest(body, {}));

    expect(response.status).toBe(401);
  });
});
