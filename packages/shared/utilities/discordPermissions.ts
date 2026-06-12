const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

export function hasGuildAdminPermission(permissions: string | undefined | null) {
  if (!permissions) return false;
  try {
    const perms = BigInt(permissions);
    return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}
