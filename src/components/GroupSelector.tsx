import { useState, useEffect } from 'react';
import { Plus, LogIn, Copy, Check, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types';
import { createGroup, joinGroupByCode, subscribeToUserGroups } from '../lib/firestore';

interface GroupSelectorProps {
  onSelectGroup: (groupId: string) => void;
}

export default function GroupSelector({ onSelectGroup }: GroupSelectorProps) {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserGroups(user.uid, (g) => {
      setGroups(g);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newGroupName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const id = await createGroup(newGroupName.trim(), user);
      setShowCreate(false);
      setNewGroupName('');
      onSelectGroup(id);
    } catch (e: any) {
      setError(e.message || 'Không thể tạo nhóm');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    setError('');
    try {
      const id = await joinGroupByCode(joinCode.trim(), user);
      if (id) {
        setShowJoin(false);
        setJoinCode('');
        onSelectGroup(id);
      } else {
        setError('Không tìm thấy nhóm với mã mời này');
      }
    } catch (e: any) {
      setError(e.message || 'Không thể tham gia nhóm');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#012d1d] rounded-xl flex items-center justify-center">
            <span className="text-sm font-extrabold text-white select-none">FS</span>
          </div>
          <h1 className="text-lg font-extrabold text-[#012d1d] tracking-tight">FairShare</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <img
                src={user.photoURL || ''}
                alt={user.displayName || ''}
                className="w-8 h-8 rounded-full border border-stone-100"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={signOut}
                className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
              >
                Đăng xuất
              </button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="max-w-lg w-full space-y-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center md:text-left"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">
              Xin chào, {user?.displayName?.split(' ')[0] || 'bạn'} 👋
            </h2>
            <p className="text-stone-500 text-sm font-medium mt-1">
              Chọn một nhóm chi tiêu hoặc tạo nhóm mới để bắt đầu.
            </p>
          </motion.div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
              className="bg-[#012d1d] hover:bg-[#152b1c] text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus size={18} />
              Tạo nhóm mới
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
              className="bg-white border border-[#c1c8c2] hover:border-[#012d1d] text-[#012d1d] py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogIn size={18} />
              Tham gia nhóm
            </button>
          </div>

          {/* Create group form */}
          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl p-5 border border-[#c1c8c2]/30 shadow-soft space-y-4">
                  <h3 className="font-bold text-sm text-[#012d1d]">Tạo nhóm chi tiêu mới</h3>
                  <input
                    type="text"
                    placeholder="Tên nhóm (ví dụ: Apartment 4B, Team lunch...)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#151c27] focus:outline-[#012d1d] font-medium placeholder:text-stone-400"
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-[#93000a] font-bold">⚠️ {error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="flex-1 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={creating || !newGroupName.trim()}
                      className="flex-1 py-2.5 bg-[#012d1d] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-[#152b1c] transition-colors"
                    >
                      {creating ? 'Đang tạo...' : 'Tạo nhóm'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join group form */}
          <AnimatePresence>
            {showJoin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl p-5 border border-[#c1c8c2]/30 shadow-soft space-y-4">
                  <h3 className="font-bold text-sm text-[#012d1d]">Tham gia nhóm bằng mã mời</h3>
                  <input
                    type="text"
                    placeholder="Nhập mã mời 6 ký tự (ví dụ: ABC123)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    maxLength={6}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#151c27] focus:outline-[#012d1d] font-bold tracking-widest text-center uppercase placeholder:tracking-normal placeholder:font-medium placeholder:normal-case"
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-[#93000a] font-bold">⚠️ {error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowJoin(false)}
                      className="flex-1 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleJoin}
                      disabled={joining || joinCode.length < 6}
                      className="flex-1 py-2.5 bg-[#012d1d] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-[#152b1c] transition-colors"
                    >
                      {joining ? 'Đang tham gia...' : 'Tham gia'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Groups list */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#012d1d] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-stone-400 mt-3 font-medium">Đang tải nhóm...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
              <Users size={40} className="text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500 font-medium">Bạn chưa tham gia nhóm nào</p>
              <p className="text-xs text-stone-400 mt-1">Tạo nhóm mới hoặc tham gia bằng mã mời</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                Nhóm của bạn ({groups.length})
              </h3>
              {groups.map((group, i) => (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectGroup(group.id)}
                  className="w-full bg-white rounded-2xl p-5 border border-[#c1c8c2]/30 shadow-soft hover:shadow-md hover:border-[#012d1d]/20 transition-all flex items-center justify-between cursor-pointer group text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-sm select-none shrink-0">
                      {group.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#151c27] leading-tight group-hover:text-[#012d1d] transition-colors">
                        {group.name}
                      </h4>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">
                        {group.memberUids.length} thành viên
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-stone-400 group-hover:text-[#012d1d] transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
