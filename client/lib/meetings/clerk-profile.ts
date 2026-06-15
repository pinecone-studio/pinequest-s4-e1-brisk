export type ClerkProfile = {
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  internalUserId: string | null;
};

let activeProfile: ClerkProfile | null = null;

export function setClerkProfile(profile: ClerkProfile | null) {
  activeProfile = profile;
}

export function getClerkProfile() {
  return activeProfile;
}
