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
import { Group, GroupMember, Transaction, Task, GroupNotification, Note, PersonalTransaction } from '../types';

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

  // Create real-time notification
  try {
    await addDoc(
      collection(db, 'groups', groupDoc.id, 'notifications'),
      {
        groupId: groupDoc.id,
        type: 'member_joined',
        title: 'Thành viên mới',
        message: `${member.name} đã tham gia nhóm!`,
        createdBy: user.uid,
        createdByName: member.name,
        createdByAvatar: member.avatar,
        createdAt: new Date().toISOString(),
        readBy: [],
      }
    );
  } catch (err) {
    console.error('Error creating member join notification:', err);
  }

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

// VND Currency formatter helper for notifications
const formatVND = (value: number) => {
  const roundedValue = Math.round(value);
  const formatted = roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} ₫`;
};

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

  // Trigger notification!
  try {
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    let creatorName = 'Thành viên';
    let creatorAvatar = '';
    if (groupSnap.exists()) {
      const groupData = groupSnap.data() as Group;
      const creator = groupData.members[tx.createdBy];
      if (creator) {
        creatorName = creator.name;
        creatorAvatar = creator.avatar;
      }
    }

    const isSettleUp = tx.title.startsWith('Quyết toán:');
    const type = isSettleUp ? 'settle_up' : 'expense_added';
    const title = isSettleUp ? 'Đã quyết toán số dư' : 'Chi phí mới';
    
    let message = '';
    if (isSettleUp) {
      message = `${creatorName} đã thực hiện quyết toán số dư: "${tx.title}" với số tiền ${formatVND(tx.amount)}`;
    } else {
      message = `${creatorName} đã thêm chi phí "${tx.title}" trị giá ${formatVND(tx.amount)}`;
    }

    await addDoc(collection(db, 'groups', groupId, 'notifications'), {
      groupId,
      type,
      title,
      message,
      createdBy: tx.createdBy,
      createdByName: creatorName,
      createdByAvatar: creatorAvatar,
      createdAt: new Date().toISOString(),
      readBy: [],
      metadata: {
        transactionId: docRef.id,
        amount: tx.amount,
      }
    });
  } catch (err) {
    console.error('Error adding transaction notification:', err);
  }

  return docRef.id;
}

export async function deleteTransaction(
  groupId: string,
  txId: string,
  userId?: string
): Promise<void> {
  const txRef = doc(db, 'groups', groupId, 'transactions', txId);
  
  // Try fetching transaction data for the notification
  let txData: Transaction | null = null;
  try {
    const txSnap = await getDoc(txRef);
    if (txSnap.exists()) {
      txData = { id: txSnap.id, ...txSnap.data() } as Transaction;
    }
  } catch (err) {
    console.error('Error fetching transaction before deletion:', err);
  }

  await deleteDoc(txRef);

  if (txData) {
    try {
      let deleterName = 'Thành viên';
      let deleterAvatar = '';
      if (userId) {
        const groupSnap = await getDoc(doc(db, 'groups', groupId));
        if (groupSnap.exists()) {
          const groupData = groupSnap.data() as Group;
          const deleter = groupData.members[userId];
          if (deleter) {
            deleterName = deleter.name;
            deleterAvatar = deleter.avatar;
          }
        }
      }

      await addDoc(
        collection(db, 'groups', groupId, 'notifications'),
        {
          groupId,
          type: 'expense_deleted',
          title: 'Đã xóa chi phí',
          message: `${deleterName} đã xóa chi phí "${txData.title}" trị giá ${formatVND(txData.amount)}`,
          createdBy: userId || 'system',
          createdByName: deleterName,
          createdByAvatar: deleterAvatar,
          createdAt: new Date().toISOString(),
          readBy: [],
        }
      );
    } catch (err) {
      console.error('Error creating expense deletion notification:', err);
    }
  }
}

export async function updateTransaction(
  groupId: string,
  txId: string,
  updates: Partial<Transaction>,
  userId?: string
): Promise<void> {
  const txRef = doc(db, 'groups', groupId, 'transactions', txId);
  await updateDoc(txRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  try {
    let updaterName = 'Thành viên';
    let updaterAvatar = '';
    if (userId) {
      const groupSnap = await getDoc(doc(db, 'groups', groupId));
      if (groupSnap.exists()) {
        const groupData = groupSnap.data() as Group;
        const updater = groupData.members[userId];
        if (updater) {
          updaterName = updater.name;
          updaterAvatar = updater.avatar;
        }
      }
    }

    const titleStr = updates.title ? `"${updates.title}"` : 'chi phí';
    await addDoc(
      collection(db, 'groups', groupId, 'notifications'),
      {
        groupId,
        type: 'expense_updated',
        title: 'Đã cập nhật chi phí',
        message: `${updaterName} đã cập nhật ${titleStr}`,
        createdBy: userId || 'system',
        createdByName: updaterName,
        createdByAvatar: updaterAvatar,
        createdAt: new Date().toISOString(),
        readBy: [],
        metadata: {
          transactionId: txId,
        }
      }
    );
  } catch (err) {
    console.error('Error creating expense update notification:', err);
  }
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

  // Real-time notification
  try {
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    let creatorName = 'Thành viên';
    let creatorAvatar = '';
    let assigneeName = '';
    if (groupSnap.exists()) {
      const groupData = groupSnap.data() as Group;
      const creator = groupData.members[task.createdBy];
      if (creator) {
        creatorName = creator.name;
        creatorAvatar = creator.avatar;
      }
      if (task.assignedTo) {
        const assignee = groupData.members[task.assignedTo];
        if (assignee) {
          assigneeName = assignee.name;
        }
      }
    }

    const message = task.assignedTo && assigneeName
      ? `${creatorName} đã tạo nhiệm vụ "${task.title}" và giao cho ${assigneeName}`
      : `${creatorName} đã tạo nhiệm vụ "${task.title}"`;

    await addDoc(
      collection(db, 'groups', groupId, 'notifications'),
      {
        groupId,
        type: 'task_added',
        title: 'Nhiệm vụ mới',
        message,
        createdBy: task.createdBy,
        createdByName: creatorName,
        createdByAvatar: creatorAvatar,
        createdAt: new Date().toISOString(),
        readBy: [],
        metadata: {
          taskId: docRef.id,
          assignedTo: task.assignedTo || null,
        }
      }
    );
  } catch (err) {
    console.error('Error creating task added notification:', err);
  }

  return docRef.id;
}

export async function deleteTask(
  groupId: string,
  taskId: string,
  userId?: string
): Promise<void> {
  const taskRef = doc(db, 'groups', groupId, 'tasks', taskId);
  
  let taskData: Task | null = null;
  try {
    const taskSnap = await getDoc(taskRef);
    if (taskSnap.exists()) {
      taskData = { id: taskSnap.id, ...taskSnap.data() } as Task;
    }
  } catch (err) {
    console.error('Error fetching task before deletion:', err);
  }

  await deleteDoc(taskRef);

  if (taskData) {
    try {
      let deleterName = 'Thành viên';
      let deleterAvatar = '';
      if (userId) {
        const groupSnap = await getDoc(doc(db, 'groups', groupId));
        if (groupSnap.exists()) {
          const groupData = groupSnap.data() as Group;
          const deleter = groupData.members[userId];
          if (deleter) {
            deleterName = deleter.name;
            deleterAvatar = deleter.avatar;
          }
        }
      }

      await addDoc(
        collection(db, 'groups', groupId, 'notifications'),
        {
          groupId,
          type: 'task_deleted',
          title: 'Đã xóa nhiệm vụ',
          message: `${deleterName} đã xóa nhiệm vụ "${taskData.title}"`,
          createdBy: userId || 'system',
          createdByName: deleterName,
          createdByAvatar: deleterAvatar,
          createdAt: new Date().toISOString(),
          readBy: [],
        }
      );
    } catch (err) {
      console.error('Error creating task deletion notification:', err);
    }
  }
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

  // Real-time notification
  if (user) {
    try {
      const taskSnap = await getDoc(doc(db, 'groups', groupId, 'tasks', taskId));
      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as Task;
        
        let creatorAvatar = '';
        const groupSnap = await getDoc(doc(db, 'groups', groupId));
        if (groupSnap.exists()) {
          const groupData = groupSnap.data() as Group;
          const creator = groupData.members[user.uid];
          if (creator) {
            creatorAvatar = creator.avatar;
          }
        }

        const message = completed
          ? `${user.name} đã hoàn thành nhiệm vụ "${taskData.title}"`
          : `${user.name} đã đánh dấu chưa hoàn thành cho nhiệm vụ "${taskData.title}"`;

        await addDoc(
          collection(db, 'groups', groupId, 'notifications'),
          {
            groupId,
            type: 'task_completed',
            title: completed ? 'Đã hoàn thành nhiệm vụ' : 'Đã cập nhật nhiệm vụ',
            message,
            createdBy: user.uid,
            createdByName: user.name,
            createdByAvatar: creatorAvatar,
            createdAt: new Date().toISOString(),
            readBy: [],
            metadata: {
              taskId,
            }
          }
        );
      }
    } catch (err) {
      console.error('Error creating task toggle notification:', err);
    }
  }
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

// ─── Note Operations ───

export async function addNote(
  groupId: string,
  note: Omit<Note, 'id' | 'createdAt'>
): Promise<string> {
  const noteData = {
    ...note,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(
    collection(db, 'groups', groupId, 'notes'),
    noteData
  );

  try {
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    let creatorName = 'Thành viên';
    let creatorAvatar = '';
    if (groupSnap.exists()) {
      const groupData = groupSnap.data() as Group;
      const creator = groupData.members[note.createdBy];
      if (creator) {
        creatorName = creator.name;
        creatorAvatar = creator.avatar;
      }
    }

    await addDoc(
      collection(db, 'groups', groupId, 'notifications'),
      {
        groupId,
        type: 'note_added',
        title: 'Ghi chú mới',
        message: `${creatorName} đã tạo ghi chú "${note.title}"`,
        createdBy: note.createdBy,
        createdByName: creatorName,
        createdByAvatar: creatorAvatar,
        createdAt: new Date().toISOString(),
        readBy: [],
        metadata: {
          noteId: docRef.id,
        }
      }
    );
  } catch (err) {
    console.error('Error creating note added notification:', err);
  }

  return docRef.id;
}

export async function updateNote(
  groupId: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(doc(db, 'groups', groupId, 'notes', noteId), updateData);
}

export async function deleteNote(
  groupId: string,
  noteId: string,
  userId?: string
): Promise<void> {
  const noteRef = doc(db, 'groups', groupId, 'notes', noteId);
  
  let noteData: Note | null = null;
  try {
    const noteSnap = await getDoc(noteRef);
    if (noteSnap.exists()) {
      noteData = { id: noteSnap.id, ...noteSnap.data() } as Note;
    }
  } catch (err) {
    console.error('Error fetching note before deletion:', err);
  }

  await deleteDoc(noteRef);

  if (noteData) {
    try {
      let deleterName = 'Thành viên';
      let deleterAvatar = '';
      if (userId) {
        const groupSnap = await getDoc(doc(db, 'groups', groupId));
        if (groupSnap.exists()) {
          const groupData = groupSnap.data() as Group;
          const deleter = groupData.members[userId];
          if (deleter) {
            deleterName = deleter.name;
            deleterAvatar = deleter.avatar;
          }
        }
      }

      await addDoc(
        collection(db, 'groups', groupId, 'notifications'),
        {
          groupId,
          type: 'note_deleted',
          title: 'Đã xóa ghi chú',
          message: `${deleterName} đã xóa ghi chú "${noteData.title}"`,
          createdBy: userId || 'system',
          createdByName: deleterName,
          createdByAvatar: deleterAvatar,
          createdAt: new Date().toISOString(),
          readBy: [],
        }
      );
    } catch (err) {
      console.error('Error creating note deletion notification:', err);
    }
  }
}

export function subscribeToNotes(
  groupId: string,
  callback: (notes: Note[]) => void,
  onError?: (error: any) => void
): () => void {
  const q = query(
    collection(db, 'groups', groupId, 'notes'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: Note[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      callback(notes);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error('Error subscribing to notes:', error);
      }
    }
  );
}

// ─── Notification Operations ───

export function subscribeToNotifications(
  groupId: string,
  callback: (notifications: GroupNotification[]) => void
): () => void {
  const q = query(
    collection(db, 'groups', groupId, 'notifications'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: GroupNotification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GroupNotification[];
    callback(notifications);
  });
}

export async function markNotificationAsRead(
  groupId: string,
  notificationId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, 'groups', groupId, 'notifications', notificationId);
  await updateDoc(docRef, {
    readBy: arrayUnion(userId),
  });
}

export async function markAllNotificationsAsRead(
  groupId: string,
  notifications: GroupNotification[],
  userId: string
): Promise<void> {
  const unread = notifications.filter((n) => !n.readBy.includes(userId));
  const promises = unread.map((n) =>
    updateDoc(doc(db, 'groups', groupId, 'notifications', n.id), {
      readBy: arrayUnion(userId),
    })
  );
  await Promise.all(promises);
}

export async function clearAllNotifications(
  groupId: string,
  notifications: GroupNotification[]
): Promise<void> {
  const promises = notifications.map((n) =>
    deleteDoc(doc(db, 'groups', groupId, 'notifications', n.id))
  );
  await Promise.all(promises);
}

// ─── Personal Transaction Operations ───

export async function addPersonalTransaction(
  userId: string,
  tx: Omit<PersonalTransaction, 'id' | 'createdAt' | 'userId'>
): Promise<string> {
  const txData = {
    ...tx,
    userId,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(
    collection(db, 'users', userId, 'personal_transactions'),
    txData
  );

  return docRef.id;
}

export async function deletePersonalTransaction(
  userId: string,
  txId: string
): Promise<void> {
  const txRef = doc(db, 'users', userId, 'personal_transactions', txId);
  await deleteDoc(txRef);
}

export async function updatePersonalTransaction(
  userId: string,
  txId: string,
  updates: Partial<PersonalTransaction>
): Promise<void> {
  const txRef = doc(db, 'users', userId, 'personal_transactions', txId);
  await updateDoc(txRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeToPersonalTransactions(
  userId: string,
  callback: (transactions: PersonalTransaction[]) => void,
  onError?: (error: any) => void
): () => void {
  const q = query(
    collection(db, 'users', userId, 'personal_transactions'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: PersonalTransaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PersonalTransaction[];
      callback(transactions);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error('Error subscribing to personal transactions:', error);
      }
    }
  );
}

