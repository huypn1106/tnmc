import { useEffect, useState } from 'react';
import { Task } from '../types';
import { subscribeToTasks } from '../lib/firestore';

export function useTasks(groupId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!groupId) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToTasks(
      groupId,
      (ts) => {
        setTasks(ts);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks in hook:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [groupId]);

  return { tasks, loading, error };
}
