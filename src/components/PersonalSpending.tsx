import { useState, useMemo, FormEvent } from 'react';
import { Wallet, Plus, Trash2, Edit2, Utensils, ShoppingBag, Car, MoreHorizontal, Calendar, Tag, Check, X } from 'lucide-react';
import { PersonalTransaction, CategoryType } from '../types';
import MonthFilter from './MonthFilter';

interface PersonalSpendingProps {
  transactions: PersonalTransaction[];
  userId: string;
  onAddTransaction: (tx: Omit<PersonalTransaction, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onUpdateTransaction: (txId: string, updates: Partial<PersonalTransaction>) => Promise<void>;
  onDeleteTransaction: (txId: string) => Promise<void>;
  formatVND: (value: number) => string;
}

export default function PersonalSpending({
  transactions,
  userId,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  formatVND,
}: PersonalSpendingProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<PersonalTransaction | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const categoryIcons: Record<CategoryType, any> = {
    dining: Utensils,
    groceries: ShoppingBag,
    transport: Car,
    utilities: MoreHorizontal,
    internet: MoreHorizontal,
    other: MoreHorizontal,
  };

  const categoryLabels: Record<CategoryType, string> = {
    dining: 'Ăn uống',
    groceries: 'Mua sắm',
    transport: 'Di chuyển',
    utilities: 'Tiện ích',
    internet: 'Internet',
    other: 'Khác',
  };

  const categoryBg: Record<CategoryType, string> = {
    dining: 'bg-orange-50 text-orange-700 border-orange-200',
    groceries: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    transport: 'bg-blue-50 text-blue-700 border-blue-200',
    utilities: 'bg-purple-50 text-purple-700 border-purple-200',
    internet: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    other: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  // Available months
  const availableMonths = useMemo(() => {
    const list = new Set<string>();
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    list.add(currentMonth);

    transactions.forEach((tx) => {
      try {
        const parts = tx.date.split('-');
        if (parts.length >= 2) list.add(`${parts[0]}-${parts[1]}`);
      } catch (e) {}
    });
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Monthly Total
  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredTransactions]);

  const openAddModal = () => {
    setEditingTx(null);
    setTitle('');
    setAmount('');
    setCategory('dining');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: PersonalTransaction) => {
    setEditingTx(tx);
    setTitle(tx.title);
    setAmount(tx.amount.toLocaleString('vi-VN'));
    setCategory(tx.category);
    setDate(tx.date);
    setDescription(tx.description || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề chi phí');
      return;
    }

    try {
      if (editingTx) {
        await onUpdateTransaction(editingTx.id, {
          title: title.trim(),
          amount: numericAmount,
          category,
          date,
          description: description.trim(),
        });
      } else {
        await onAddTransaction({
          title: title.trim(),
          amount: numericAmount,
          category,
          date,
          description: description.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Đã xảy ra lỗi khi lưu chi tiêu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight flex items-center gap-2">
            <Wallet className="text-[#1b4332]" />
            Chi tiêu cá nhân
          </h2>
          <p className="text-stone-500 text-sm font-medium mt-1">
            Quản lý và theo dõi các khoản chi riêng tư của bạn.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#012d1d] hover:bg-[#152b1c] text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <Plus size={18} />
          <span>Thêm chi tiêu</span>
        </button>
      </div>

      {/* Month Filter */}
      <MonthFilter
        selectedMonth={selectedMonth}
        onChangeMonth={setSelectedMonth}
        availableMonths={availableMonths}
      />

      {/* Overview Stat Card */}
      <div className="bg-gradient-to-br from-[#012d1d] to-[#153e2b] text-white rounded-2xl p-6 shadow-lg border border-[#012d1d]/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs text-[#aeeecb] font-bold uppercase tracking-wider">
            Tổng chi tiêu cá nhân ({selectedMonth === 'all' ? 'Tất cả' : selectedMonth})
          </p>
          <h3 className="text-3xl md:text-4xl font-extrabold font-sans mt-2 tracking-tight">
            {formatVND(totalSpent)}
          </h3>
          <p className="text-xs text-stone-300 font-medium mt-2">
            {filteredTransactions.length} giao dịch được ghi nhận
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Wallet size={24} />
            </div>
            <p className="text-sm font-bold text-stone-600">Chưa có khoản chi tiêu cá nhân nào</p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Bấm "Thêm chi tiêu" để tạo khoản chi cá nhân đầu tiên của tháng này.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const Icon = categoryIcons[tx.category] || MoreHorizontal;
            const badgeClass = categoryBg[tx.category] || categoryBg.other;

            return (
              <div
                key={tx.id}
                className="bg-white border border-stone-200/80 hover:border-[#012d1d]/30 rounded-2xl p-4 shadow-sm transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${badgeClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-800 text-sm md:text-base truncate">
                      {tx.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-400 font-medium">
                      <span>{tx.date}</span>
                      {tx.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px] md:max-w-[250px]">{tx.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-extrabold text-sm md:text-base text-[#012d1d] font-sans">
                    {formatVND(tx.amount)}
                  </span>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-1.5 text-stone-400 hover:text-[#012d1d] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#012d1d] tracking-tight">
                {editingTx ? 'Sửa chi tiêu cá nhân' : 'Thêm chi tiêu cá nhân'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="bg-[#ffdad6] border border-[#93000a]/20 text-[#93000a] text-xs font-bold p-3 rounded-xl">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-widest block mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  placeholder="Cà phê, Tiền sách, Mua áo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-2.5 text-sm focus:outline-[#012d1d] font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-widest block mb-1">
                  Số tiền (VNĐ)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setAmount(clean === '' ? '' : Number(clean).toLocaleString('vi-VN'));
                  }}
                  className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-2.5 text-sm focus:outline-[#012d1d] font-bold text-[#012d1d]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-widest block mb-1">
                    Danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-xl px-3 py-2.5 text-sm focus:outline-[#012d1d] font-semibold cursor-pointer"
                  >
                    <option value="dining">Ăn uống</option>
                    <option value="groceries">Mua sắm</option>
                    <option value="transport">Di chuyển</option>
                    <option value="utilities">Tiện ích</option>
                    <option value="internet">Internet</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-widest block mb-1">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-xl px-3 py-2.5 text-sm focus:outline-[#012d1d] font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-widest block mb-1">
                  Ghi chú (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Thông tin thêm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-2.5 text-sm focus:outline-[#012d1d] font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#012d1d] hover:bg-[#152b1c] text-white font-bold text-xs transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={16} />
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
