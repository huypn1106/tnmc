import { useState, useEffect } from 'react';
import { subscribeToPersonalTransactions } from '../lib/firestore';
import { PersonalTransaction } from '../types';

export function usePersonalTransactions(userId: string | undefined | null) {
  const [personalTransactions, setPersonalTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPersonalTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPersonalTransactions(
      userId,
      (fetchedTx) => {
        setPersonalTransactions(fetchedTx);
        setLoading(false);
      },
      (err) => {
        console.error('Error in usePersonalTransactions:', err);
        setError('Không thể tải dữ liệu chi tiêu cá nhân. Vui lòng thử lại sau.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { personalTransactions, loading, error };
}
