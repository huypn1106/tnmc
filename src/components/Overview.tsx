import { ArrowUp, ArrowDown, Check, Bolt, ShoppingBag, Wifi, Utensils, Car, MoreHorizontal } from 'lucide-react';
import { Transaction, GroupMember, CategoryType } from '../types';

interface OverviewProps {
  transactions: Transaction[];
  members: GroupMember[];
  membersMap: Record<string, GroupMember>;
  currentUserId: string;
  groupName: string;
  setActiveTab: (tab: string) => void;
  formatVND: (value: number) => string;
}

export default function Overview({ transactions, members, membersMap, currentUserId, groupName, setActiveTab, formatVND }: OverviewProps) {
  // Aggregate stats
  const totalGroupSpending = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // User spending = sum of user shares
  const userFairShare = transactions.reduce((sum, tx) => {
    if (tx.splitWith.includes(currentUserId)) {
      return sum + tx.amount / tx.splitWith.length;
    }
    return sum;
  }, 0);

  // User paid
  const userPaid = transactions.reduce((sum, tx) => {
    if (tx.paidBy === currentUserId) {
      return sum + tx.amount;
    }
    return sum;
  }, 0);

  const userBalance = userPaid - userFairShare;

  // Spending by categories
  const categorySpending: Record<CategoryType, number> = {
    utilities: 0, dining: 0, groceries: 0, transport: 0, internet: 0, other: 0,
  };

  transactions.forEach((tx) => {
    categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
  });

  const categoryLabels: Record<CategoryType, string> = {
    utilities: 'Tiền điện/nước', groceries: 'Mua sắm tạp hóa', internet: 'Internet',
    dining: 'Ăn uống', transport: 'Di chuyển', other: 'Chi tiêu khác',
  };

  const categoryColors: Record<CategoryType, string> = {
    utilities: 'bg-[#1b4332]', groceries: 'bg-[#2c694e]', internet: 'bg-[#2a4131]',
    dining: 'bg-[#95d4b3]', transport: 'bg-[#3f6653]', other: 'bg-stone-400',
  };

  const categoriesList = Object.keys(categorySpending)
    .map((key) => {
      const id = key as CategoryType;
      const amount = categorySpending[id];
      const percent = totalGroupSpending > 0 ? (amount / totalGroupSpending) * 100 : 0;
      return { id, label: categoryLabels[id], amount, percent };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const renderCategoryIcon = (category: CategoryType) => {
    const size = 18;
    switch (category) {
      case 'utilities': return <Bolt size={size} />;
      case 'groceries': return <ShoppingBag size={size} />;
      case 'internet': return <Wifi size={size} />;
      case 'dining': return <Utensils size={size} />;
      case 'transport': return <Car size={size} />;
      default: return <MoreHorizontal size={size} />;
    }
  };

  const getRelativeDateLabel = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hôm nay';
    if (dateStr === yesterdayStr) return 'Hôm qua';

    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]} Thg ${parts[1]}`;
    } catch (e) {}
    return dateStr;
  };

  const getMemberName = (uid: string) => {
    if (uid === currentUserId) return 'Bạn';
    return membersMap[uid]?.name || 'Thành viên';
  };

  return (
    <div className="space-y-6">
      {/* Overview Headings */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">
            Tổng quan tháng này
          </h2>
          <p className="text-[#414844] text-sm font-medium mt-1">
            {groupName} - Giao dịch & Chia sẻ Chi tiêu
          </p>
        </div>
        <div className="text-xs bg-[#e2e8f8] text-[#151c27] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full font-mono mt-2 md:mt-0 select-none shrink-0 self-start md:self-auto">
          UTC {new Date().toISOString().slice(11, 16)}
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Balance Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#c1c8c2]/30 shadow-soft flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-6 w-full">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold font-sans mb-1 select-none">
                Số dư của tôi
              </p>
              {userBalance < 0 ? (
                <>
                  <h3 className="text-3xl md:text-4xl font-extrabold font-sans text-[#ba1a1a]">
                    {formatVND(Math.abs(userBalance))}
                  </h3>
                  <p className="text-xs text-[#ba1a1a]/90 font-medium mt-2.5 flex items-center gap-1 leading-none select-none">
                    <ArrowUp size={14} className="stroke-[2.5px]" />
                    Bạn đang nợ trong nhóm
                  </p>
                </>
              ) : userBalance > 0 ? (
                <>
                  <h3 className="text-3xl md:text-4xl font-extrabold font-sans text-[#2c694e]">
                    +{formatVND(userBalance)}
                  </h3>
                  <p className="text-xs text-[#2c694e]/90 font-medium mt-2.5 flex items-center gap-1 leading-none select-none">
                    <ArrowDown size={14} className="stroke-[2.5px]" />
                    Bạn được nhận lại từ mọi người
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-3xl md:text-4xl font-extrabold font-sans text-stone-600">
                    {formatVND(0)}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium mt-2.5 flex items-center gap-1 leading-none select-none">
                    <Check size={14} className="stroke-[2.5px]" />
                    Mọi khoản nợ đã được tất toán sòng phẳng
                  </p>
                </>
              )}
            </div>

            {userBalance < 0 ? (
              <div className="bg-[#ffdad6] text-[#93000a] px-3.5 py-1.5 rounded-full text-xs font-bold leading-none select-none shadow-sm">
                Chưa thanh toán
              </div>
            ) : (
              <div className="bg-[#aeeecb]/40 text-[#012d1d] px-3.5 py-1.5 rounded-full text-xs font-bold leading-none select-none shadow-sm">
                Sòng phẳng
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 mt-4 border-t border-[#c1c8c2]/20">
            <div>
              <p className="text-xs text-stone-400 font-medium mb-1 select-none">Tổng chi tiêu nhóm</p>
              <p className="text-lg md:text-xl font-bold text-[#012d1d] leading-tight font-sans">
                {formatVND(totalGroupSpending)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium mb-1 select-none">Chi tiêu của tôi</p>
              <p className="text-lg md:text-xl font-bold text-[#012d1d] leading-tight font-sans">
                {formatVND(userFairShare)}
              </p>
            </div>
          </div>
        </div>

        {/* Spending Categories */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#c1c8c2]/30 shadow-soft hover:shadow-md transition-all duration-300">
          <h3 className="text-base font-bold text-[#012d1d] mb-4 tracking-tight select-none">
            Danh mục chi tiêu
          </h3>
          <div className="space-y-4">
            {categoriesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-400 font-mono">
                Chưa có dữ liệu danh mục chi tiêu nào
              </div>
            ) : (
              categoriesList.slice(0, 4).map((c) => (
                <div key={c.id} className="group">
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-stone-700 font-medium">{c.label}</span>
                    <span className="text-[#012d1d] font-bold font-mono">{Math.round(c.percent)}%</span>
                  </div>
                  <div className="w-full bg-[#f0f3ff] h-2 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${categoryColors[c.id]}`}
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#c1c8c2]/30 shadow-soft hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-[#012d1d] tracking-tight">
            Hoạt động gần đây
          </h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-[#316e52] hover:text-[#1b4332] text-xs font-bold transition-colors cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-sm text-stone-400 font-sans">
              Chưa có hoạt động giao dịch nào được tạo.
            </div>
          ) : (
            transactions.slice(0, 4).map((tx) => {
              const payerName = getMemberName(tx.paidBy);

              let personalStatusText = '';
              let isLent = false;

              if (tx.paidBy === currentUserId) {
                if (tx.splitWith.includes(currentUserId)) {
                  const myShare = tx.amount / tx.splitWith.length;
                  const lentAmount = tx.amount - myShare;
                  personalStatusText = `Bạn cho mượn ${formatVND(lentAmount)}`;
                  isLent = true;
                } else {
                  personalStatusText = `Bạn cho mượn ${formatVND(tx.amount)}`;
                  isLent = true;
                }
              } else {
                if (tx.splitWith.includes(currentUserId)) {
                  const myOweAmount = tx.amount / tx.splitWith.length;
                  personalStatusText = `Bạn nợ ${formatVND(myOweAmount)}`;
                  isLent = false;
                } else {
                  personalStatusText = 'Không liên quan';
                  isLent = false;
                }
              }

              return (
                <div key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#aeeecb]/30 text-[#012d1d] flex items-center justify-center shrink-0">
                      {renderCategoryIcon(tx.category)}
                    </div>
                    <div>
                      <p className="text-sm text-stone-900 font-bold group-hover:text-[#1b4332] transition-colors leading-snug">
                        {tx.title}
                      </p>
                      <p className="text-xs text-stone-500 font-medium mt-0.5 leading-none">
                        {payerName} đã trả • {getRelativeDateLabel(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-stone-900 font-bold tracking-tight font-sans">
                      {formatVND(tx.amount)}
                    </p>
                    {personalStatusText !== 'Không liên quan' ? (
                      <p className={`text-[11px] font-bold mt-0.5 leading-none tracking-tight ${isLent ? 'text-[#2c694e]' : 'text-[#ba1a1a]'}`}>
                        {personalStatusText}
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium text-stone-400 mt-0.5 leading-none">
                        {personalStatusText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
