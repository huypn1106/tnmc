import { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  BellOff, 
  CheckCircle2, 
  PlusCircle, 
  Trash2, 
  UserPlus, 
  DollarSign, 
  Activity, 
  XCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from '../lib/firestore';

interface HeaderProps {
  title?: string;
  user: User;
  onExitGroup: () => void;
  groupId?: string | null;
}

// Relative time formatter in Vietnamese
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return 'Gần đây';
  }
}

// Style selector for notification items
const getNotificationStyles = (type: string) => {
  switch (type) {
    case 'expense_added':
      return {
        icon: <DollarSign size={14} className="text-emerald-600" />,
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
      };
    case 'expense_deleted':
      return {
        icon: <Trash2 size={14} className="text-rose-600" />,
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-100',
      };
    case 'settle_up':
      return {
        icon: <CheckCircle2 size={14} className="text-teal-600" />,
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-100',
      };
    case 'task_added':
      return {
        icon: <PlusCircle size={14} className="text-blue-600" />,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
      };
    case 'task_completed':
      return {
        icon: <CheckCircle2 size={14} className="text-green-600" />,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-100',
      };
    case 'task_deleted':
      return {
        icon: <XCircle size={14} className="text-amber-600" />,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
      };
    case 'member_joined':
      return {
        icon: <UserPlus size={14} className="text-purple-600" />,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
      };
    default:
      return {
        icon: <Activity size={14} className="text-stone-500" />,
        bgColor: 'bg-stone-50',
        borderColor: 'border-stone-100',
      };
  }
};

export default function Header({ title = 'FairShare', user, onExitGroup, groupId }: HeaderProps) {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Real-time notifications subscription
  const { notifications } = useNotifications(groupId || null);

  // Compute unread count (notifications not created by the current user and not read by the current user yet)
  const unreadNotifications = notifications.filter(
    (n) => !n.readBy.includes(user.uid) && n.createdBy !== user.uid
  );
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {/* Dynamic Notification Center */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`text-stone-500 hover:text-stone-800 hover:bg-stone-50 p-2 rounded-full transition-all relative cursor-pointer ${
              isOpen ? 'bg-stone-100 text-stone-800 scale-95' : ''
            }`}
            title="Thông báo"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 bg-[#ba1a1a] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_1px_4px_rgba(186,26,26,0.4)] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl shadow-xl w-[320px] sm:w-[380px] z-50 flex flex-col overflow-hidden max-h-[480px]">
              {/* Dropdown Header */}
              <div className="p-4 border-b border-stone-100 bg-[#012d1d]/5 flex items-center justify-between select-none">
                <div>
                  <h3 className="text-xs font-black text-[#012d1d] uppercase tracking-wider">Thông báo nhóm</h3>
                  <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                    {unreadCount > 0 ? `Có ${unreadCount} hoạt động mới chưa đọc` : 'Không có hoạt động mới'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllNotificationsAsRead(groupId!, notifications, user.uid)}
                      className="text-[10px] text-[#2c694e] hover:text-[#012d1d] hover:bg-white border border-stone-200 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer shadow-sm"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      Đọc tất cả
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => clearAllNotifications(groupId!, notifications)}
                      className="text-[10px] text-stone-400 hover:text-rose-600 hover:bg-white border border-stone-200 p-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                      title="Xóa tất cả thông báo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto divide-y divide-stone-100 max-h-[360px] hide-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center select-none">
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 mb-3 shadow-inner">
                      <BellOff size={18} />
                    </div>
                    <p className="text-xs font-bold text-stone-700">Mọi thứ đều yên tĩnh</p>
                    <p className="text-[10px] text-stone-400 mt-1 max-w-[200px] leading-relaxed font-medium">
                      Các hoạt động mới như thêm chi phí hay đổi nhiệm vụ sẽ xuất hiện ở đây!
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.readBy.includes(user.uid) && notif.createdBy !== user.uid;
                    const styles = getNotificationStyles(notif.type);
                    
                    return (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (isUnread) {
                            markNotificationAsRead(groupId!, notif.id, user.uid);
                          }
                        }}
                        className={`p-3.5 flex items-start gap-3 transition-colors duration-150 relative group ${
                          isUnread 
                            ? 'bg-[#aeeecb]/5 hover:bg-[#aeeecb]/10 cursor-pointer' 
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        {/* Status indicators */}
                        {isUnread && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#2c694e] rounded-full shadow-[0_0_4px_rgba(44,105,78,0.5)]" />
                        )}

                        {/* Icon Container */}
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${styles.bgColor} ${styles.borderColor} shadow-sm transition-transform group-hover:scale-105 duration-200`}>
                          {styles.icon}
                        </div>

                        {/* Message content */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className={`text-xs font-black truncate leading-snug ${isUnread ? 'text-[#012d1d]' : 'text-stone-700'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[9px] text-stone-400 shrink-0 font-medium font-sans">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed break-words font-medium ${isUnread ? 'text-stone-800' : 'text-stone-500'}`}>
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

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
