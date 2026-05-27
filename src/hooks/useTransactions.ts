import { useEffect, useState, useMemo } from 'react';
import { Transaction, GroupMember } from '../types';
import { subscribeToTransactions } from '../lib/firestore';

export function useTransactions(groupId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToTransactions(groupId, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  return { transactions, loading };
}

/** Compute balances from transactions for a set of member UIDs */
export function useBalances(
  transactions: Transaction[],
  memberUids: string[]
) {
  return useMemo(() => {
    return memberUids.reduce((acc, uid) => {
      const paid = transactions.reduce(
        (sum, tx) => (tx.paidBy === uid ? sum + tx.amount : sum),
        0
      );
      const share = transactions.reduce((sum, tx) => {
        if (tx.splitWith.includes(uid)) {
          return sum + tx.amount / tx.splitWith.length;
        }
        return sum;
      }, 0);
      acc[uid] = paid - share;
      return acc;
    }, {} as Record<string, number>);
  }, [transactions, memberUids]);
}
