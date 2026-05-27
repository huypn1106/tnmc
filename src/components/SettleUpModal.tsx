import { useState, FormEvent } from 'react';
import { X, Check } from 'lucide-react';
import { GroupMember, Transaction } from '../types';

interface SettleUpModalProps {
  members: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  formatVND: (value: number) => string;
}

export default function SettleUpModal({ members, currentUserId, onClose, onAddTransaction, formatVND }: SettleUpModalProps) {
  const defaultPayer = members.find(m => m.uid !== currentUserId)?.uid || members[0]?.uid || '';
  const defaultReceiver = members.find(m => m.uid === currentUserId)?.uid || members[1]?.uid || '';

  const [payerId, setPayerId] = useState(defaultPayer);
  const [receiverId, setReceiverId] = useState(defaultReceiver);
  const [amount, setAmount] = useState('200000');
  const [errorMessage, setErrorMessage] = useState('');

  const getMemberName = (uid: string) => {
    if (uid === currentUserId) return 'Bạn';
    return members.find(m => m.uid === uid)?.name || 'Thành viên';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) { setErrorMessage('Số tiền cần lớn hơn 0 ₫'); return; }
    if (payerId === receiverId) { setErrorMessage('Người trả và người nhận không thể trùng nhau'); return; }

    const payerName = getMemberName(payerId);
    const receiverName = getMemberName(receiverId);

    onAddTransaction({
      title: `Quyết toán: ${payerName} trả ${receiverName}`,
      description: 'Giao dịch quyết toán số dư nợ trực tiếp',
      category: 'other',
      amount: numericAmount,
      date: new Date().toISOString().split('T')[0],
      paidBy: payerId,
      splitWith: [receiverId],
      createdBy: currentUserId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 bg-stone-50">
          <h3 className="font-extrabold text-base text-[#012d1d] tracking-tight">Quyết toán & Sòng phẳng nợ</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="bg-[#ffdad6] p-3 rounded-xl border border-[#93000a]/15 text-[#93000a] text-xs font-bold">⚠️ {errorMessage}</div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Số tiền chuyển khoản</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-[#012d1d] text-lg">₫</span>
              <input type="text" inputMode="numeric" value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-stone-50/50 border border-stone-200 focus:border-[#012d1d] rounded-xl py-3 pl-8 pr-4 font-bold text-lg text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#1b4332]/25 font-sans" required />
            </div>
            {amount && <p className="text-[10px] text-stone-400 font-mono text-right">Bằng chữ: {formatVND(parseFloat(amount))}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Người trả</label>
              <select value={payerId} onChange={(e) => setPayerId(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 cursor-pointer focus:outline-[#012d1d]">
                {members.map((m) => <option key={m.uid} value={m.uid}>{getMemberName(m.uid)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Người nhận</label>
              <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 cursor-pointer focus:outline-[#012d1d]">
                {members.map((m) => <option key={m.uid} value={m.uid}>{getMemberName(m.uid)}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-2.5">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 rounded-xl transition-all font-bold text-xs cursor-pointer">Hủy bỏ</button>
            <button type="submit" className="flex-1 py-3 bg-[#012d1d] hover:bg-[#152b1c] text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-98 flex justify-center items-center gap-1 cursor-pointer">
              <Check size={14} className="stroke-[3px]" /><span>Ghi nhận</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
