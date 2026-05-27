import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useGroup } from './hooks/useGroup';
import { useTransactions, useBalances } from './hooks/useTransactions';
import { addTransaction as firestoreAddTransaction, deleteTransaction } from './lib/firestore';
import { Transaction, GroupMember } from './types';

import LoginPage from './components/LoginPage';
import GroupSelector from './components/GroupSelector';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Overview from './components/Overview';
import Transactions from './components/Transactions';
import NewExpense from './components/NewExpense';
import GroupBalances from './components/GroupBalances';
import SettleUpModal from './components/SettleUpModal';

// Core vietnamese currency formatter helper
const formatVND = (value: number) => {
  const roundedValue = Math.round(value);
  const formatted = roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} ₫`;
};

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    return localStorage.getItem('fairshare_active_group') || null;
  });
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const { group, loading: groupLoading } = useGroup(activeGroupId);
  const { transactions, loading: txLoading } = useTransactions(activeGroupId);

  // Get member UIDs and member map from group
  const memberUids = group?.memberUids || [];
  const membersMap = group?.members || {};
  const membersArray: GroupMember[] = memberUids.map((uid) => membersMap[uid]).filter(Boolean);

  // Compute balances
  const balances = useBalances(transactions, memberUids);

  // Show loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#012d1d] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400 mt-4 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginPage />;
  }

  // No group selected
  if (!activeGroupId || (!groupLoading && !group)) {
    return (
      <GroupSelector
        onSelectGroup={(id) => {
          setActiveGroupId(id);
          localStorage.setItem('fairshare_active_group', id);
        }}
      />
    );
  }

  // Loading group data
  if (groupLoading || txLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#012d1d] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400 mt-4 font-medium">Đang tải nhóm...</p>
        </div>
      </div>
    );
  }

  // Add transaction handler
  const handleAddTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!activeGroupId) return;
    await firestoreAddTransaction(activeGroupId, tx);
  };

  // Settle a single member
  const handleSettleMember = async (memberId: string) => {
    if (!activeGroupId || !user) return;
    const balance = balances[memberId] || 0;
    if (balance >= 0) return;

    const creditorId = Object.keys(balances).find((id) => balances[id] > 0);
    if (!creditorId) return;

    const debtorName = membersMap[memberId]?.name || 'Thành viên';
    const creditorName = membersMap[creditorId]?.name || 'Thành viên';

    await firestoreAddTransaction(activeGroupId, {
      title: `Quyết toán: ${debtorName} trả ${creditorName}`,
      description: `Đã trả hoàn toàn khoản nợ`,
      category: 'other',
      amount: Math.abs(balance),
      date: new Date().toISOString().split('T')[0],
      paidBy: memberId,
      splitWith: [creditorId],
      createdBy: user.uid,
    });
  };

  // Settle all
  const handleSettleAll = async () => {
    if (!activeGroupId || !user) return;

    const creditors = Object.keys(balances)
      .filter((id) => balances[id] > 0)
      .map((id) => ({ id, balance: balances[id] }));

    const debtors = Object.keys(balances)
      .filter((id) => balances[id] < 0)
      .map((id) => ({ id, balance: Math.abs(balances[id]) }));

    if (debtors.length === 0 || creditors.length === 0) return;

    let dIdx = 0;
    let cIdx = 0;
    const debList = debtors.map((d) => ({ ...d }));
    const credList = creditors.map((c) => ({ ...c }));

    while (dIdx < debList.length && cIdx < credList.length) {
      const debtor = debList[dIdx];
      const creditor = credList[cIdx];
      const payAmount = Math.min(debtor.balance, creditor.balance);

      const dName = membersMap[debtor.id]?.name || debtor.id;
      const cName = membersMap[creditor.id]?.name || creditor.id;

      await firestoreAddTransaction(activeGroupId, {
        title: `Quyết toán: ${dName} trả ${cName}`,
        description: `Thanh toán sòng phẳng tự động toàn nhóm`,
        category: 'other',
        amount: payAmount,
        date: new Date().toISOString().split('T')[0],
        paidBy: debtor.id,
        splitWith: [creditor.id],
        createdBy: user.uid,
      });

      debtor.balance -= payAmount;
      creditor.balance -= payAmount;
      if (debtor.balance <= 1) dIdx++;
      if (creditor.balance <= 1) cIdx++;
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (txId: string) => {
    if (!activeGroupId) return;
    await deleteTransaction(activeGroupId, txId);
  };

  // Exit group → go back to selector
  const handleExitGroup = () => {
    setActiveGroupId(null);
    localStorage.removeItem('fairshare_active_group');
    setActiveTab('overview');
  };

  const getHeaderTitle = () => {
    const groupName = group?.name || 'FairShare';
    switch (activeTab) {
      case 'overview':
        return `${groupName}`;
      case 'transactions':
        return 'Lịch sử Giao dịch';
      case 'new-expense':
        return 'Thêm chi phí';
      case 'balances':
        return 'Thành viên & Số dư';
      default:
        return groupName;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            transactions={transactions}
            members={membersArray}
            membersMap={membersMap}
            currentUserId={user.uid}
            groupName={group?.name || ''}
            setActiveTab={setActiveTab}
            formatVND={formatVND}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            members={membersArray}
            membersMap={membersMap}
            currentUserId={user.uid}
            formatVND={formatVND}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'new-expense':
        return (
          <NewExpense
            members={membersArray}
            currentUserId={user.uid}
            onAddTransaction={handleAddTransaction}
            setActiveTab={setActiveTab}
            formatVND={formatVND}
          />
        );
      case 'balances':
        return (
          <GroupBalances
            transactions={transactions}
            members={membersArray}
            membersMap={membersMap}
            currentUserId={user.uid}
            onSettleMember={handleSettleMember}
            onSettleAll={handleSettleAll}
            formatVND={formatVND}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSettleUpClick={() => setIsSettleModalOpen(true)}
        groupName={group?.name || 'FairShare'}
        inviteCode={group?.inviteCode || ''}
        onExitGroup={handleExitGroup}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header
          title={getHeaderTitle()}
          user={user}
          onExitGroup={handleExitGroup}
        />

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 pt-6 px-4 md:px-8 max-w-7xl mx-auto w-full hide-scrollbar">
          {renderTabContent()}
        </main>

        {activeTab !== 'new-expense' && (
          <button
            onClick={() => setActiveTab('new-expense')}
            className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#012d1d] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-95 transition-transform duration-200 z-40 active:scale-90"
          >
            ➕
          </button>
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {isSettleModalOpen && (
        <SettleUpModal
          members={membersArray}
          currentUserId={user.uid}
          onClose={() => setIsSettleModalOpen(false)}
          onAddTransaction={handleAddTransaction}
          formatVND={formatVND}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
