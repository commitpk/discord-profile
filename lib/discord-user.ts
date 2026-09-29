export interface DiscordUser {
  id: string;
  username: string;
  globalName: string | null;
  avatarHash: string | null;
}

export interface RawDiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface RawInteractionMember {
  user?: RawDiscordUser;
}

export function extractDiscordUser(interaction: {
  member?: RawInteractionMember;
  user?: RawDiscordUser;
}): DiscordUser {
  const raw = interaction.member?.user ?? interaction.user;
  if (!raw) {
    throw new Error("Interaction has no user information");
  }
  return {
    id: raw.id,
    username: raw.username,
    globalName: raw.global_name ?? null,
    avatarHash: raw.avatar ?? null,
  };
}

export function getAvatarUrl(user: DiscordUser): string | null {
  if (!user.avatarHash) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatarHash}.png?size=256`;
}

export function getDisplayName(user: DiscordUser): string {
  return user.globalName ?? user.username;
}

export function getInitial(user: DiscordUser): string {
  const name = getDisplayName(user).trim();
  return name.charAt(0).toUpperCase() || "?";
}
