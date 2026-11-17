// The address is stored in two parts and only joined at runtime, so it never
// appears whole in the HTML or JS bundle (handoff §11.2).
export function assembleEmail(parts: { user: string; domain: string }): string {
  return `${parts.user}@${parts.domain}`;
}

export function mailtoHref(parts: { user: string; domain: string }): string {
  return `mailto:${assembleEmail(parts)}`;
}
