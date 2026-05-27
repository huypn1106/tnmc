import { Bell, Search, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  user: User;
  onExitGroup: () => void;
}

export default function Header({ title = 'FairShare', user, onExitGroup }: HeaderProps) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-100 flex justify-between items-center w-full px-6 h-16 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={onExitGroup}
          className="md:hidden p-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
          title="Đổi nhóm"
        >
          <LogOut size={18} />
        </button>
        <h1 className="text-xl font-extrabold text-[#012d1d] tracking-tight select-none truncate max-w-[200px] md:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="text-stone-500 hover:text-stone-800 hover:bg-stone-50 p-2 rounded-full transition-colors relative cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ba1a1a] rounded-full"></span>
        </button>

        {/* User avatar with sign-out dropdown */}
        <div className="relative group">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c1c8c2] ml-2 select-none shadow-sm cursor-pointer hover:ring-2 hover:ring-[#1b4332]/20 transition-all duration-200">
            {user.photoURL ? (
              <img
                alt={user.displayName || 'User'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                src={user.photoURL}
              />
            ) : (
              <div className="w-full h-full bg-[#012d1d] text-white flex items-center justify-center text-xs font-bold">
                {(user.displayName || 'U').charAt(0)}
              </div>
            )}
          </div>
          {/* Dropdown on hover */}
          <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg p-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="px-3 py-2 border-b border-stone-100 mb-1">
              <p className="text-xs font-bold text-stone-800 truncate">{user.displayName}</p>
              <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
