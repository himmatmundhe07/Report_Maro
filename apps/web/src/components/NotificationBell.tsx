import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { useNotificationStore } from '../store/notificationStore.js';

export function NotificationBell() {
  const { items, unreadCount, setInitial, markAllRead } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get('/notifications')
      .then((res) => setInitial(res.data.data, res.data.unreadCount))
      .catch(() => undefined);
  }, [setInitial]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (unreadCount > 0) {
      await apiClient.post('/notifications/read-all').catch(() => undefined);
      markAllRead();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-slate-700 dark:text-slate-300 text-xl">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Notifications</span>
            <span className="text-[10px] text-slate-400 font-normal">Marked as read</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 && (
              <p className="p-4 text-center text-xs text-slate-400">No notifications yet.</p>
            )}
            {items.map((n) => (
              <div key={n._id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <p className="text-xs text-slate-800 dark:text-slate-200">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
