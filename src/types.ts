export type CategoryType = 'utilities' | 'groceries' | 'internet' | 'other' | 'dining' | 'transport';

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

export interface GroupMember {
  uid: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  memberUids: string[]; // array of UIDs for querying
  members: Record<string, GroupMember>; // uid -> member info
  inviteCode: string;
}

export interface Transaction {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  amount: number;
  date: string; // YYYY-MM-DD
  paidBy: string; // uid
  splitWith: string[]; // array of uids
  createdBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  month: string; // YYYY-MM
  completed: boolean;
  completedBy?: string; // uid
  completedByName?: string; // cached name
  completedAt?: string; // ISO string
  createdBy: string; // uid
  createdByName?: string; // cached name
  createdAt: string; // ISO string
  assignedTo?: string; // uid (optional assignee)
}

