import { useEffect, useState } from 'react';
import { Group } from '../types';
import { subscribeToGroup } from '../lib/firestore';

export function useGroup(groupId: string | null) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToGroup(groupId, (g) => {
      setGroup(g);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  return { group, loading };
}
