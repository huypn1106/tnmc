import { useState } from 'react';
import { LayoutGrid, Receipt, PlusCircle, Users, Copy, Check, LogOut, CheckSquare, StickyNote } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSettleUpClick: () => void;
  groupName: string;
  inviteCode: string;
  onExitGroup: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onSettleUpClick, groupName, inviteCode, onExitGroup }: SidebarProps) {
  const [copied, setCopied] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutGrid },
    { id: 'transactions', label: 'Giao dịch', icon: Receipt },
    { id: 'tasks', label: 'Nhiệm vụ', icon: CheckSquare },
    { id: 'notes', label: 'Ghi chú', icon: StickyNote },
    { id: 'new-expense', label: 'Thêm chi phí', icon: PlusCircle },
    { id: 'balances', label: 'Thành viên & Số dư', icon: Users },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 py-6 bg-[#f0f3ff] w-64 border-r border-[#c1c8c2] shrink-0 justify-between">
      <div>
        {/* Brand */}
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-sm select-none">
            {groupName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-[#012d1d] tracking-tight truncate">{groupName}</h2>
            <p className="text-xs text-stone-500 font-medium font-sans">Active Group</p>
          </div>
        </div>

        {/* Invite code */}
        {inviteCode && (
          <div className="px-4 mb-6">
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-between bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 hover:border-[#012d1d]/30 transition-colors cursor-pointer group"
            >
              <div className="text-left">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Mã mời</p>
                <p className="text-sm font-bold text-[#012d1d] tracking-widest font-mono">{inviteCode}</p>
              </div>
              {copied ? (
                <Check size={14} className="text-[#2c694e]" />
              ) : (
                <Copy size={14} className="text-stone-400 group-hover:text-[#012d1d]" />
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm text-left group border border-transparent ${
                  isActive ? 'bg-[#1b4332] text-white shadow-sm' : 'text-[#414844] hover:bg-white hover:text-[#012d1d] hover:border-stone-100'
                }`}>
                <Icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-stone-500 group-hover:text-[#012d1d]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-4 space-y-2">
        <button onClick={onSettleUpClick}
          className="w-full bg-[#012d1d] hover:bg-[#152b1c] text-white py-3.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-98 select-none cursor-pointer">
          Settle Up
        </button>
        <button onClick={onExitGroup}
          className="w-full flex items-center justify-center gap-2 text-stone-500 hover:text-stone-800 py-2.5 px-4 rounded-xl font-medium text-xs transition-colors cursor-pointer hover:bg-white">
          <LogOut size={14} />
          <span>Đổi nhóm</span>
        </button>
      </div>
    </nav>
  );
}
