import React from "react";
import { ImageResponse } from "next/og";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Theme } from "./themes";

const FONT_PATH = path.join(process.cwd(), "fonts", "NotoSansKR-Regular.ttf");

export interface CardInput {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  initial: string;
  theme: Theme;
}

/**
 * NotoSansKR-Regular.ttf가 없으면 한글이 깨진 채로(tofu) 렌더링되거나
 * 다른 폰트로 조용히 대체될 수 있으므로, 반드시 명확한 에러로 실패시킨다.
 * 다른 폰트 파일로 대체하지 말 것.
 */
async function loadKoreanFont(): Promise<ArrayBuffer> {
  try {
    await stat(FONT_PATH);
  } catch {
    throw new Error(
      `한글 폰트 파일을 찾을 수 없습니다: ${FONT_PATH}\n` +
        `fonts/NotoSansKR-Regular.ttf (정적 TTF, woff2 아님)를 프로젝트에 추가한 뒤 다시 시도하세요. ` +
        `다른 폰트 파일을 이 이름으로 대체하지 마세요 — 한글 글리프가 없는 폰트를 쓰면 렌더링이 깨집니다.`
    );
  }

  const buffer = await readFile(FONT_PATH);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

async function loadAvatarDataUrl(avatarUrl: string): Promise<string> {
  const res = await fetch(avatarUrl);
  if (!res.ok) {
    throw new Error(
      `아바타 이미지를 가져오지 못했습니다: ${avatarUrl} (status ${res.status})`
    );
  }
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  return `data:image/png;base64,${base64}`;
}

export async function renderProfileCard(input: CardInput): Promise<ArrayBuffer> {
  const fontData = await loadKoreanFont();
  const avatarDataUrl = input.avatarUrl
    ? await loadAvatarDataUrl(input.avatarUrl)
    : null;
  const { theme } = input;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "300px",
          display: "flex",
          flexDirection: "column",
          background: theme.background,
          fontFamily: "NotoSansKR",
        }}
      >
        <div style={{ display: "flex", width: "100%", height: "110px", background: theme.accent }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "space-between",
            padding: "0 32px 32px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "24px",
            }}
          >
            {avatarDataUrl ? (
              <img
                src={avatarDataUrl}
                width={96}
                height={96}
                style={{
                  borderRadius: "48px",
                  border: `4px solid ${theme.background}`,
                  marginTop: "-48px",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "96px",
                  height: "96px",
                  borderRadius: "48px",
                  background: theme.accent,
                  border: `4px solid ${theme.background}`,
                  color: "#0b0b0f",
                  fontSize: "40px",
                  fontWeight: 700,
                  marginTop: "-48px",
                }}
              >
                {input.initial}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "12px",
                maxWidth: "416px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: theme.textPrimary,
                  maxWidth: "416px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {input.displayName}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "20px",
                  color: theme.textSecondary,
                }}
              >
                @{input.username}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "14px",
              color: theme.textSecondary,
            }}
          >
            Unofficial card · Not affiliated with Discord Inc.
          </div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 300,
      fonts: [
        {
          name: "NotoSansKR",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );

  return image.arrayBuffer();
}
