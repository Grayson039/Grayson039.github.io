// Unread-activity badge: counts likes, comments and new followers since the person last opened Activity.
import { app } from './ui.js';

export async function refreshBadge() {
  try {
    const list = await app.api.listActivity();
    const seen = app.profile?.settings?.activitySeenAt || '';
    app.unread = list.filter((a) => a.createdAt > seen).length;
  } catch { app.unread = 0; }
  document.dispatchEvent(new Event('badge-changed'));
}
