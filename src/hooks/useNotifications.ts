import { useEffect, useState } from 'react';
import { GroupNotification } from '../types';
import { subscribeToNotifications } from '../lib/firestore';

export function useNotifications(groupId: string | null) {
  const [notifications, setNotifications] = useState<GroupNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(groupId, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  return { notifications, loading };
}
