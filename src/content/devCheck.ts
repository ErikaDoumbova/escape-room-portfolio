// Dev only: report content problems in the browser console (CI runs the full
// check with friendlier output via `npm run validate-content`).
import { describeIssue } from './checks.ts';
import { RoomSchema, SiteSchema } from './schema.ts';

export function devCheck(site: unknown, rooms: Record<string, unknown>) {
  const report = (file: string, data: unknown, schema: typeof SiteSchema | typeof RoomSchema) => {
    const result = schema.safeParse(data);
    if (result.success) return;
    for (const issue of result.error.issues) {
      const { message, tip } = describeIssue(issue, data);
      console.error(`✖ ${file} → ${message}${tip ? `\n  ${tip}` : ''}`);
    }
  };
  report('content/site.json', site, SiteSchema);
  for (const [path, room] of Object.entries(rooms)) {
    report(path.replace('../../', ''), room, RoomSchema);
  }
}
