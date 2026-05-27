import { useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, Sparkles } from 'lucide-react';
import { Transaction, GroupMember } from '../types';

interface GroupBalancesProps {
  transactions: Transaction[];
  members: GroupMember[];
  membersMap: Record<string, GroupMember>;
  currentUserId: string;
  onSettleMember: (memberId: string) => void;
  onSettleAll: () => void;
  formatVND: (value: number) => string;
}

export default function GroupBalances({ transactions, members, membersMap, currentUserId, onSettleMember, onSettleAll, formatVND }: GroupBalancesProps) {
  const [notification, setNotification] = useState('');

  const totalGroupSpending = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const memberUids = members.map(m => m.uid);

  // Compute balances
  const balances = memberUids.reduce((acc, uid) => {
    const paid = transactions.reduce((sum, tx) => (tx.paidBy === uid ? sum + tx.amount : sum), 0);
    const share = transactions.reduce((sum, tx) => {
      if (tx.splitWith.includes(uid)) return sum + tx.amount / tx.splitWith.length;
      return sum;
    }, 0);
    acc[uid] = paid - share;
    return acc;
  }, {} as Record<string, number>);

  const outstandingDebtsTotal = Object.values(balances).reduce((sum, bal) => bal < 0 ? sum + Math.abs(bal) : sum, 0);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const getMemberName = (uid: string) => {
    if (uid === currentUserId) return 'Bạn';
    return membersMap[uid]?.name || 'Thành viên';
  };

  const handleSettleAction = (memberId: string) => {
    onSettleMember(memberId);
    triggerNotification(`✨ Đã thanh toán sòng phẳng với ${getMemberName(memberId)}!`);
  };

  return (
    <div className="space-y-6 relative">
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#1b4332] text-white font-bold text-xs p-4 rounded-xl shadow-lg flex items-center gap-3 select-none max-w-sm">
          <Sparkles size={16} className="text-[#aeeecb] animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">Thành viên & Số dư</h2>
          <p className="text-stone-500 text-sm font-medium mt-1">Tổng quan sòng phẳng nợ nần của các thành viên.</p>
        </div>
        <button
          onClick={() => { onSettleAll(); triggerNotification('🎉 Tất cả số dư nợ đã được quyết toán sòng phẳng!'); }}
          className="bg-[#012d1d] hover:bg-[#152b1c] text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 w-full md:w-auto cursor-pointer select-none"
        >
          Settle All Balances
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const balanceVal = balances[member.uid] || 0;
          const isPositive = balanceVal > 0;
          const isNegative = balanceVal < 0;
          const isSettled = balanceVal === 0;
          const statusText = isPositive ? 'Nhận lại' : isNegative ? 'Cần trả' : 'Đã thanh toán';
          const name = getMemberName(member.uid);

          return (
            <div key={member.uid} className={`bg-white rounded-2xl p-5 shadow-soft flex flex-col justify-between border border-[#c1c8c2]/30 hover:shadow-md transition-all duration-200 ${isSettled ? 'opacity-70' : ''}`}>
              <div className="flex items-center justify-between mb-5 w-full">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {member.avatar ? (
                      <img alt={name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-stone-100" referrerPolicy="no-referrer" src={member.avatar} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-lg shrink-0">{name.charAt(0)}</div>
                    )}
                    {!isSettled && (
                      <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-white select-none shadow-sm text-[10px] ${isPositive ? 'bg-[#2c694e]' : 'bg-[#ba1a1a]'}`}>
                        {isPositive ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111827] leading-none mb-1.5 select-all">{name}</h3>
                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider leading-none">{statusText}</p>
                  </div>
                </div>
                {isPositive ? <TrendingUp className="text-[#2c694e] shrink-0" size={18} /> : isNegative ? <TrendingDown className="text-[#ba1a1a] shrink-0" size={18} /> : <CheckCircle2 className="text-[#316e52] shrink-0" size={18} />}
              </div>

              <div className="text-right py-2 select-all">
                {isPositive ? (
                  <span className="font-sans font-extrabold text-lg text-[#2c694e] tracking-tight">+{formatVND(balanceVal)}</span>
                ) : isNegative ? (
                  <span className="font-sans font-extrabold text-lg text-[#ba1a1a] tracking-tight">-{formatVND(Math.abs(balanceVal))}</span>
                ) : (
                  <span className="font-sans font-extrabold text-[#414844] text-lg tracking-tight select-none">0₫</span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100">
                {isNegative ? (
                  <button onClick={() => handleSettleAction(member.uid)}
                    className="w-full bg-[#012d1d] hover:bg-[#152b1c] text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm cursor-pointer select-none">
                    Thanh toán nợ
                  </button>
                ) : (
                  <button disabled className="w-full border border-stone-200 bg-stone-50 text-stone-400 font-bold text-xs py-2 rounded-xl cursor-not-allowed select-none">
                    {isSettled ? 'Đã quyết toán' : 'Đang chờ nhận'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#f0f3ff] rounded-2xl p-6 border border-[#c1c8c2]/20 hover:border-[#c1c8c2]/40 transition-colors select-none">
        <div className="lg:col-span-2 space-y-2">
          <h3 className="font-bold text-base text-[#012d1d] tracking-tight">Tổng kết nhóm chi tiêu</h3>
          <p className="text-stone-600 text-xs md:text-sm font-medium leading-relaxed">
            Tổng chi tiêu tháng này dồn lại là{' '}
            <strong className="text-[#012d1d] text-sm md:text-base font-extrabold font-sans">{formatVND(totalGroupSpending)}</strong>.
            Có <strong className="text-[#012d1d] font-bold">{Object.values(balances).filter(b => b < 0).length} thành viên nợ</strong>{' '}
            cần được quyết toán sòng phẳng.
          </p>
        </div>
        <div className="flex flex-col justify-center items-start lg:items-end">
          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-1 leading-none">Tổng nợ chưa trả</span>
          <span className="font-sans font-extrabold text-[#ba1a1a] text-xl md:text-2xl leading-none">-{formatVND(outstandingDebtsTotal)}</span>
        </div>
      </div>
    </div>
  );
}
