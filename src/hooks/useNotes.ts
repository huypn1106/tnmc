import { useState, useEffect } from 'react';
import { subscribeToNotes } from '../lib/firestore';
import { Note } from '../types';

export function useNotes(groupId: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToNotes(
      groupId,
      (fetchedNotes) => {
        setNotes(fetchedNotes);
        setLoading(false);
      },
      (err) => {
        console.error('Error in useNotes:', err);
        setError('Không thể tải ghi chú. Vui lòng thử lại sau.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  return { notes, loading, error };
}
