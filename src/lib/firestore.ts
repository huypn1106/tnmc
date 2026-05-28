import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  getDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Group, GroupMember, Transaction, Task } from '../types';

// ─── Group Operations ───

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createGroup(
  name: string,
  user: { uid: string; displayName: string | null; photoURL: string | null }
): Promise<string> {
  const member: GroupMember = {
    uid: user.uid,
    name: user.displayName || 'Người dùng',
    avatar: user.photoURL || '',
    joinedAt: new Date().toISOString(),
  };

  const groupData = {
    name,
    createdBy: user.uid,
    createdAt: new Date().toISOString(),
    memberUids: [user.uid],
    members: { [user.uid]: member },
    inviteCode: generateInviteCode(),
  };

  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return docRef.id;
}

export async function joinGroupByCode(
  inviteCode: string,
  user: { uid: string; displayName: string | null; photoURL: string | null }
): Promise<string | null> {
  const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const groupDoc = snapshot.docs[0];
  const groupData = groupDoc.data() as Omit<Group, 'id'>;

  // Already a member?
  if (groupData.memberUids.includes(user.uid)) {
    return groupDoc.id;
  }

  const member: GroupMember = {
    uid: user.uid,
    name: user.displayName || 'Người dùng',
    avatar: user.photoURL || '',
    joinedAt: new Date().toISOString(),
  };

  await updateDoc(groupDoc.ref, {
    memberUids: arrayUnion(user.uid),
    [`members.${user.uid}`]: member,
  });

  return groupDoc.id;
}

export function subscribeToUserGroups(
  userId: string,
  callback: (groups: Group[]) => void
): () => void {
  const q = query(
    collection(db, 'groups'),
    where('memberUids', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const groups: Group[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Group[];
    callback(groups);
  });
}

export function subscribeToGroup(
  groupId: string,
  callback: (group: Group | null) => void
): () => void {
  return onSnapshot(doc(db, 'groups', groupId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Group);
    } else {
      callback(null);
    }
  });
}

// ─── Transaction Operations ───

export async function addTransaction(
  groupId: string,
  tx: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
  const txData = {
    ...tx,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(
    collection(db, 'groups', groupId, 'transactions'),
    txData
  );
  return docRef.id;
}

export async function deleteTransaction(
  groupId: string,
  txId: string
): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'transactions', txId));
}

export function subscribeToTransactions(
  groupId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const q = query(
    collection(db, 'groups', groupId, 'transactions'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
    callback(transactions);
  });
}

// ─── Task Operations ───

export async function addTask(
  groupId: string,
  task: Omit<Task, 'id' | 'createdAt' | 'completed'>
): Promise<string> {
  const taskData = {
    ...task,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(
    collection(db, 'groups', groupId, 'tasks'),
    taskData
  );
  return docRef.id;
}

export async function deleteTask(
  groupId: string,
  taskId: string
): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'tasks', taskId));
}

export async function toggleTaskStatus(
  groupId: string,
  taskId: string,
  completed: boolean,
  user: { uid: string; name: string } | null
): Promise<void> {
  const updateData = {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
    completedBy: completed ? (user?.uid || null) : null,
    completedByName: completed ? (user?.name || null) : null,
  };
  await updateDoc(doc(db, 'groups', groupId, 'tasks', taskId), updateData);
}

export function subscribeToTasks(
  groupId: string,
  callback: (tasks: Task[]) => void,
  onError?: (error: any) => void
): () => void {
  const q = query(
    collection(db, 'groups', groupId, 'tasks'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      callback(tasks);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error('Error subscribing to tasks:', error);
      }
    }
  );
}
