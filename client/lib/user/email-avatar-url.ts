export function getEmailAvatarUrl(email: string): string {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
}
