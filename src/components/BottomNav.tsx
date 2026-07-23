import { LayoutGrid, Receipt, PlusCircle, Users, CheckSquare, StickyNote, Wallet } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
    { id: 'transactions', label: 'Activity', icon: Receipt },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'balances', label: 'Members', icon: Users },
    { id: 'personal', label: 'Cá nhân', icon: Wallet },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 flex justify-around items-center pt-2 pb-5 px-2 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isPersonal = tab.id === 'personal';

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[54px] rounded-xl transition-all duration-150 relative select-none ${
              isPersonal
                ? isActive
                  ? 'text-[#012d1d] font-bold bg-emerald-100 border border-emerald-300 shadow-xs'
                  : 'text-emerald-800 font-medium bg-emerald-50/80 border border-emerald-200/60'
                : isActive
                ? 'text-[#012d1d] font-semibold bg-[#aeeecb]/30'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Icon size={18} className="mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
