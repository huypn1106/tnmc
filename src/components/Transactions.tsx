import { useState, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Bolt, ShoppingBag, Wifi, Utensils, Car, MoreHorizontal, Trash2 } from 'lucide-react';
import { Transaction, GroupMember, CategoryType } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  members: GroupMember[];
  membersMap: Record<string, GroupMember>;
  currentUserId: string;
  formatVND: (value: number) => string;
  onDeleteTransaction: (txId: string) => void;
}

export default function Transactions({ transactions, members, membersMap, currentUserId, formatVND, onDeleteTransaction }: TransactionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const categoryIconMap = (category: CategoryType) => {
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

  const getMemberName = (uid: string) => {
    if (uid === currentUserId) return 'Bạn';
    return membersMap[uid]?.name || 'Thành viên';
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedCategory !== 'Tất cả' && tx.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = tx.title.toLowerCase().includes(query);
        const descMatch = tx.description.toLowerCase().includes(query);
        const payer = membersMap[tx.paidBy];
        const payerMatch = payer ? payer.name.toLowerCase().includes(query) : false;
        if (!titleMatch && !descMatch && !payerMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedCategory, searchQuery, membersMap]);

  const formatDateVN = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]} Thg ${parts[1]}`;
    } catch (e) {}
    return dateStr;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">Lịch sử Giao dịch</h2>
          <p className="text-stone-500 text-sm font-medium mt-1">Tất cả các khoản chi tiêu chung của nhóm.</p>
        </div>
        <div className="relative w-full md:max-w-xs shrink-0">
          <input type="text" placeholder="Tìm kiếm chi tiêu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#c1c8c2] rounded-full px-4 py-2 text-sm text-[#151c27] focus:outline-none focus:border-[#012d1d] focus:ring-2 focus:ring-[#1b4332]/20 shadow-sm pr-10" />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">🔎</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center select-none bg-stone-50 p-3 rounded-2xl border border-stone-100">
        <SlidersHorizontal size={16} className="text-stone-500 mr-1 hidden sm:block" />
        <div className="relative shrink-0">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-white border border-[#c1c8c2] rounded-full py-1.5 pl-4 pr-10 text-xs font-bold text-stone-700 focus:outline-[#012d1d] cursor-pointer">
            <option value="Tất cả">Tất cả danh mục</option>
            <option value="utilities">Tiện ích</option>
            <option value="dining">Ăn uống</option>
            <option value="groceries">Siêu thị & Tạp hóa</option>
            <option value="transport">Di chuyển</option>
            <option value="internet">Internet</option>
            <option value="other">Chi tiêu khác</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>
        {(selectedCategory !== 'Tất cả' || searchQuery !== '') && (
          <button onClick={() => { setSelectedCategory('Tất cả'); setSearchQuery(''); }}
            className="text-xs text-[#ba1a1a] hover:text-[#93000a] font-bold px-2 py-1 underline transition-all cursor-pointer">Xóa bộ lọc</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransactions.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-2xl border border-stone-150 text-sm text-stone-400">
            Không tìm thấy khoản chi tiêu nào khớp với bộ lọc.
          </div>
        ) : (
          filteredTransactions.slice(0, visibleCount).map((tx) => {
            const payerName = getMemberName(tx.paidBy);
            const avatarUrl = membersMap[tx.paidBy]?.avatar || '';
            return (
              <div key={tx.id} className="bg-white rounded-2xl p-5 shadow-soft border border-[#c1c8c2]/35 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 group/card">
                <div>
                  <div className="flex justify-between items-start gap-3 mb-5">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-[#aeeecb]/40 text-[#012d1d] flex items-center justify-center shrink-0">{categoryIconMap(tx.category)}</div>
                      <div>
                        <h3 className="font-bold text-base text-[#151c27] tracking-tight leading-snug line-clamp-1">{tx.title}</h3>
                        {tx.description && <p className="text-xs text-stone-500 font-medium leading-none mt-1 line-clamp-1">{tx.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-stone-500 bg-[#f0f3ff] px-2 py-1 rounded-md select-none">{formatDateVN(tx.date)}</span>
                      <button onClick={() => onDeleteTransaction(tx.id)} className="opacity-0 group-hover/card:opacity-100 text-stone-400 hover:text-[#ba1a1a] p-1 rounded-md hover:bg-[#ffdad6]/50 transition-all cursor-pointer" title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4 pt-3.5 border-t border-stone-100">
                  <div className="flex items-center gap-2 select-none">
                    {avatarUrl ? (
                      <img alt={payerName} className="w-6 h-6 rounded-full object-cover shrink-0 border border-stone-100" referrerPolicy="no-referrer" src={avatarUrl} />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#012d1d] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{payerName.charAt(0)}</div>
                    )}
                    <span className="text-xs text-[#414844] font-medium leading-none">{payerName} đã trả</span>
                  </div>
                  <p className="font-sans font-extrabold text-[#012d1d] text-base leading-none">{formatVND(tx.amount)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredTransactions.length > visibleCount && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => setVisibleCount((prev) => prev + 3)}
            className="text-[#012d1d] font-bold text-xs px-6 py-2.5 border border-[#c1c8c2] hover:border-[#012d1d] hover:bg-stone-50 rounded-full transition-colors active:scale-95 duration-150 cursor-pointer select-none">
            Tải thêm giao dịch
          </button>
        </div>
      )}
    </div>
  );
}
