// 네트워크 호출 없이(아바타 없는 케이스만) 로컬에서 카드 PNG를 렌더링해 저장한다.
// NotoSansKR-Regular.ttf가 없으면 lib/card.tsx가 명확한 에러로 실패한다.
//
// 실행: npm run render-preview
// (내부적으로 `node --import tsx scripts/render-card-preview.mjs` 를 실행한다.
//  .tsx를 import하므로 순수 `node scripts/render-card-preview.mjs` 만으로는 실행할 수 없다.)

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderProfileCard } from "../lib/card.tsx";
import { THEMES, DEFAULT_THEME } from "../lib/themes.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".preview");

const cases = [
  { displayName: "유니", username: "yuni" },
  { displayName: "Yuni", username: "yuni-en" },
  { displayName: "김유니abc", username: "yuni-mixed" },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const theme = THEMES[DEFAULT_THEME];

  for (const testCase of cases) {
    const initial = testCase.displayName.trim().charAt(0).toUpperCase() || "?";
    const buffer = await renderProfileCard({
      displayName: testCase.displayName,
      username: testCase.username,
      avatarUrl: null,
      initial,
      theme,
    });
    const filePath = path.join(outDir, `profile-${testCase.username}.png`);
    await writeFile(filePath, Buffer.from(buffer));
    console.log(`Saved ${filePath}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
