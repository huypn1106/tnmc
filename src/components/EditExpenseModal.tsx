import { useState, FormEvent, useEffect } from 'react';
import { Utensils, ShoppingBag, Car, MoreHorizontal, Check, X } from 'lucide-react';
import { Transaction, GroupMember, CategoryType } from '../types';

interface EditExpenseModalProps {
  transaction: Transaction;
  members: GroupMember[];
  currentUserId: string;
  onUpdateTransaction: (txId: string, updates: Partial<Transaction>) => void;
  onClose: () => void;
  formatVND: (value: number) => string;
}

export default function EditExpenseModal({ transaction, members, currentUserId, onUpdateTransaction, onClose, formatVND }: EditExpenseModalProps) {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.title);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [paidBy, setPaidBy] = useState(transaction.paidBy);
  const [splitWith, setSplitWith] = useState<string[]>(transaction.splitWith);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setAmount(transaction.amount.toLocaleString('vi-VN'));
  }, [transaction.amount]);

  const chips: { id: CategoryType; label: string; icon: any }[] = [
    { id: 'dining', label: 'Ăn uống', icon: Utensils },
    { id: 'groceries', label: 'Mua sắm', icon: ShoppingBag },
    { id: 'transport', label: 'Di chuyển', icon: Car },
    { id: 'other', label: 'Khác', icon: MoreHorizontal },
  ];

  const handleToggleMember = (uid: string) => {
    setSplitWith((prev) => {
      if (prev.includes(uid)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== uid);
      }
      return [...prev, uid];
    });
  };

  const handleSplitEqually = () => setSplitWith(members.map(m => m.uid));

  const getMemberName = (uid: string) => {
    if (uid === currentUserId) return 'Bạn';
    return members.find(m => m.uid === uid)?.name || 'Thành viên';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Vui lòng nhập số tiền hợp lệ lớn hơn 0 ₫');
      return;
    }
    if (description.trim() === '') {
      setErrorMessage('Vui lòng nhập mô tả chi phí');
      return;
    }
    if (splitWith.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một người để chia hóa đơn');
      return;
    }

    onUpdateTransaction(transaction.id, {
      title: description,
      description: `Được chia sẻ với ${splitWith.map(uid => getMemberName(uid)).join(', ')}`,
      category: selectedCategory,
      amount: numericAmount,
      date: date || new Date().toISOString().split('T')[0],
      paidBy,
      splitWith,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#151c27]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="font-extrabold text-[#012d1d] text-lg">Chỉnh sửa chi phí</h3>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-[#151c27] hover:bg-stone-200/50 rounded-full transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto hide-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="flex flex-col items-center justify-center space-y-2 py-4 bg-stone-50 rounded-xl border border-stone-100/60 select-none">
              <label htmlFor="edit_amount" className="text-xs text-stone-500 font-bold uppercase tracking-wider">Số tiền giao dịch</label>
              <div className="relative w-full max-w-[240px]">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-sans font-extrabold text-[#012d1d] text-2xl">₫</span>
                <input id="edit_amount" type="text" inputMode="numeric" placeholder="0" value={amount}
                  onChange={(e) => { const clean = e.target.value.replace(/[^0-9]/g, ''); setAmount(clean === '' ? '' : Number(clean).toLocaleString('vi-VN')); }}
                  className="w-full bg-transparent border-b-2 border-[#c1c8c2] focus:border-[#012d1d] text-center font-bold text-[#012d1d] text-2xl py-1.5 focus:outline-none focus:ring-0 transition-colors font-sans pl-10 pr-6" required />
              </div>
              {amount && <p className="text-[10px] text-stone-400 font-mono font-medium">Khớp: {formatVND(parseFloat(amount.replace(/[^0-9]/g, '')))}</p>}
            </div>

            {errorMessage && (
              <div className="bg-[#ffdad6] border border-[#93000a]/20 text-[#93000a] text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 select-none">⚠️ {errorMessage}</div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="edit_description" className="text-xs font-bold text-stone-700 uppercase tracking-widest">Mô tả chi phí</label>
              <input id="edit_description" type="text" placeholder="Bữa tối, tiền gas, siêu thị..." value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-3 text-sm text-[#151c27] placeholder-stone-400 focus:outline-[#012d1d] shadow-sm font-medium" required />
            </div>

            {/* Category chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-widest block select-none">Danh mục</span>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => { const Icon = chip.icon; const isSelected = selectedCategory === chip.id; return (
                  <button key={chip.id} type="button" onClick={() => setSelectedCategory(chip.id)}
                    className={`px-4 py-2.5 rounded-full border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${isSelected ? 'border-[#1b4332] bg-[#1b4332] text-white shadow-sm' : 'border-[#c1c8c2] bg-white text-stone-600 hover:bg-stone-50'}`}>
                    <Icon size={16} /><span>{chip.label}</span>
                  </button>
                ); })}
              </div>
            </div>

            {/* Date & PaidBy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit_date" className="text-xs font-bold text-stone-700 uppercase tracking-widest">Ngày</label>
                <input id="edit_date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-3 text-sm text-[#151c27] focus:outline-[#012d1d] shadow-sm font-medium" required />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit_paid_by" className="text-xs font-bold text-stone-700 uppercase tracking-widest">Người trả</label>
                <select id="edit_paid_by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-3 text-sm text-[#151c27] focus:outline-[#012d1d] shadow-sm font-semibold cursor-pointer">
                  {members.map((m) => <option key={m.uid} value={m.uid}>{getMemberName(m.uid)}</option>)}
                </select>
              </div>
            </div>

            {/* Split checkboxes */}
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center select-none">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-widest">Chia đều với</label>
                <button type="button" onClick={handleSplitEqually} className="text-xs text-[#012d1d] font-bold hover:underline cursor-pointer">Chia đều tất cả</button>
              </div>
              <div className="bg-white border border-[#c1c8c2] rounded-2xl divide-y divide-stone-100 overflow-hidden shadow-sm">
                {members.map((member) => {
                  const isChecked = splitWith.includes(member.uid);
                  return (
                    <label key={member.uid} className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-stone-50/50 transition-colors select-none">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img alt={member.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-stone-100" referrerPolicy="no-referrer" src={member.avatar} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#012d1d] text-white flex items-center justify-center text-xs font-bold shrink-0">{member.name.charAt(0)}</div>
                        )}
                        <span className="text-sm text-stone-800 font-bold">{getMemberName(member.uid)}</span>
                      </div>
                      <input type="checkbox" checked={isChecked} onChange={() => handleToggleMember(member.uid)}
                        className="w-5 h-5 rounded border-2 border-stone-300 text-[#1b4332] focus:ring-[#1b4332]/20 cursor-pointer" />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-[#012d1d] hover:bg-[#152b1c] text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-98 flex justify-center items-center gap-2 select-none cursor-pointer">
                <Check size={18} className="stroke-[2.5px]" /><span>Cập nhật chi phí</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
