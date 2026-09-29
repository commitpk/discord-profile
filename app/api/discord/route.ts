import { InteractionResponseType, InteractionType } from "discord-interactions";
import { after } from "next/server";
import { verifyDiscordRequest } from "@/lib/discord-verify";
import {
  extractDiscordUser,
  getAvatarUrl,
  getDisplayName,
  getInitial,
  type DiscordUser,
  type RawDiscordUser,
  type RawInteractionMember,
} from "@/lib/discord-user";
import { resolveTheme, type Theme } from "@/lib/themes";
import { renderProfileCard } from "@/lib/card";

export const runtime = "nodejs";

interface DiscordCommandOption {
  name: string;
  value: string;
}

interface DiscordInteraction {
  type: number;
  token: string;
  member?: RawInteractionMember;
  user?: RawDiscordUser;
  data?: {
    name: string;
    options?: DiscordCommandOption[];
  };
}

export async function POST(request: Request): Promise<Response> {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return new Response("Server misconfigured: DISCORD_PUBLIC_KEY missing", {
      status: 500,
    });
  }

  const { isValid, body } = await verifyDiscordRequest(request, publicKey);
  if (!isValid) {
    return new Response("Bad request signature", { status: 401 });
  }

  const interaction = JSON.parse(body) as DiscordInteraction;

  if (interaction.type === InteractionType.PING) {
    return Response.json({ type: InteractionResponseType.PONG });
  }

  if (
    interaction.type === InteractionType.APPLICATION_COMMAND &&
    interaction.data?.name === "profile"
  ) {
    const appId = process.env.DISCORD_APP_ID;
    if (!appId) {
      return new Response("Server misconfigured: DISCORD_APP_ID missing", {
        status: 500,
      });
    }

    const themeOption = interaction.data.options?.find(
      (option) => option.name === "theme"
    );
    const theme = resolveTheme(themeOption?.value);
    const user = extractDiscordUser(interaction);
    const token = interaction.token;

    after(async () => {
      await sendProfileCard(appId, token, user, theme);
    });

    return Response.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });
  }

  return new Response("Unknown interaction", { status: 400 });
}

async function sendProfileCard(
  appId: string,
  token: string,
  user: DiscordUser,
  theme: Theme
): Promise<void> {
  try {
    const avatarUrl = getAvatarUrl(user);
    const pngBuffer = await renderProfileCard({
      displayName: getDisplayName(user),
      username: user.username,
      avatarUrl,
      initial: getInitial(user),
      theme,
    });

    const formData = new FormData();
    formData.append(
      "payload_json",
      JSON.stringify({ attachments: [{ id: 0, filename: "profile.png" }] })
    );
    formData.append(
      "files[0]",
      new Blob([pngBuffer], { type: "image/png" }),
      "profile.png"
    );

    const webhookUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
    const res = await fetch(webhookUrl, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      console.error(
        `Failed to patch follow-up message: ${res.status} ${await res.text()}`
      );
    }
  } catch (err) {
    console.error("Failed to render/send profile card", err);
  }
}
