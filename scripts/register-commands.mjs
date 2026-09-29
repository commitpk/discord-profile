const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error(
    "DISCORD_APP_ID and DISCORD_BOT_TOKEN must be set. " +
      "Run with: node --env-file=.env.local scripts/register-commands.mjs"
  );
  process.exit(1);
}

const commands = [
  {
    name: "profile",
    description: "내 프로필 카드를 생성합니다",
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
      {
        name: "theme",
        description: "카드 테마",
        type: 3,
        required: false,
        choices: [
          { name: "미드나잇", value: "midnight" },
          { name: "민트", value: "mint" },
          { name: "페이퍼", value: "paper" },
          { name: "선셋", value: "sunset" },
        ],
      },
    ],
  },
];

const res = await fetch(
  `https://discord.com/api/v10/applications/${APP_ID}/commands`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  }
);

if (!res.ok) {
  console.error(`Failed to register commands: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
console.log(
  `Registered ${data.length} command(s): ${data.map((c) => c.name).join(", ")}`
);
