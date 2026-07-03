import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  User, 
  Check, 
  ListTodo, 
  Sparkles,
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Task, GroupMember } from '../types';
import { addTask, deleteTask, toggleTaskStatus } from '../lib/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface TasksProps {
  groupId: string;
  tasks: Task[];
  error?: any;
  members: GroupMember[];
  membersMap: Record<string, GroupMember>;
  currentUserId: string;
  groupName: string;
}

export default function Tasks({ 
  groupId, 
  tasks, 
  error,
  members, 
  membersMap, 
  currentUserId, 
  groupName 
}: TasksProps) {
  // Render gorgeous Firestore rules config notice if permissions are missing
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">
              Nhiệm vụ & Công việc
            </h2>
            <p className="text-[#414844] text-sm font-medium mt-1">
              {groupName} - Phân công & Theo dõi công việc hàng tháng
            </p>
          </div>
        </div>

        <div className="bg-[#ffdad6] text-[#93000a] rounded-3xl p-6 border border-[#ba1a1a]/30 shadow-soft space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-lg shrink-0 mt-0.5 shadow-sm">
              !
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Thiếu quyền truy cập Cơ sở dữ liệu</h3>
              <p className="text-xs text-[#93000a]/80 mt-1 leading-relaxed">
                Quy tắc bảo mật (Firestore Security Rules) của dự án hiện chưa cho phép truy cập subcollection <code className="bg-[#ba1a1a]/10 px-1 py-0.5 rounded font-mono">tasks</code>.
              </p>
            </div>
          </div>
          
          <div className="bg-white/95 rounded-2xl p-5 text-xs border border-red-100 text-stone-700 space-y-3 leading-relaxed shadow-inner">
            <p className="font-bold text-[#ba1a1a] flex items-center gap-1.5">
              💡 Vui lòng thêm quy tắc truy cập sau trên Firebase Console &gt; Firestore Database &gt; Rules:
            </p>
            <pre className="overflow-x-auto p-3 bg-stone-50 rounded-xl border border-stone-200 font-mono text-[10px] md:text-xs text-stone-600 leading-normal">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      allow read, write: if request.auth != null;

      match /transactions/{txId} {
        allow read, write: if request.auth != null;
      }

      // THÊM ĐOẠN NÀY ĐỂ CHO PHÉP TÍNH NĂNG NHIỆM VỤ:
      match /tasks/{taskId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}`}
            </pre>
          </div>
          <p className="text-xs text-stone-500 italic mt-2 leading-relaxed">
            Sau khi cập nhật Firestore rules, hãy <b>tải lại trang (F5)</b>. Danh sách nhiệm vụ sẽ lập tức hoạt động bình thường!
          </p>
        </div>
      </div>
    );
  }
  // Current month represented as YYYY-MM
  const getCurrentMonthStr = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  
  // Add task form states
  const [newTitle, setNewTitle] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month labels helper
  const getMonthLabel = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      return `Tháng ${month}/${year}`;
    } catch (e) {
      return monthStr;
    }
  };

  // Navigate months
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const mm = String(prevMonth).padStart(2, '0');
    setSelectedMonth(`${prevYear}-${mm}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear += 1;
    }
    const mm = String(nextMonth).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${mm}`);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(getCurrentMonthStr());
  };

  // Filter tasks for current selected month
  const monthlyTasks = useMemo(() => {
    return tasks.filter((t) => t.month === selectedMonth);
  }, [tasks, selectedMonth]);

  // Derived task stats
  const stats = useMemo(() => {
    const total = monthlyTasks.length;
    const completed = monthlyTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  }, [monthlyTasks]);

  // Apply visual status filter
  const filteredTasks = useMemo(() => {
    return monthlyTasks.filter((t) => {
      if (filter === 'pending') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    });
  }, [monthlyTasks, filter]);

  // Add Task Handler
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const currentUser = membersMap[currentUserId];
      const creatorName = currentUser?.name || 'Thành viên';

      const taskPayload: any = {
        title: newTitle.trim(),
        month: selectedMonth,
        createdBy: currentUserId,
        createdByName: creatorName,
      };

      if (newAssigneeId) {
        taskPayload.assignedTo = newAssigneeId;
      }

      await addTask(groupId, taskPayload);

      setNewTitle('');
      setNewAssigneeId('');
      setIsAdding(false);
    } catch (error) {
      console.error('Lỗi khi thêm nhiệm vụ:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;
    try {
      await deleteTask(groupId, taskId, currentUserId);
    } catch (error) {
      console.error('Lỗi khi xóa nhiệm vụ:', error);
    }
  };

  // Toggle Task Completed Handler
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      const currentUser = membersMap[currentUserId];
      const name = currentUser?.name || 'Thành viên';
      await toggleTaskStatus(groupId, taskId, !currentCompleted, {
        uid: currentUserId,
        name,
      });
    } catch (error) {
      console.error('Lỗi khi đổi trạng thái nhiệm vụ:', error);
    }
  };

  // Get dynamic motivational text based on progress
  const getMotivationalText = () => {
    if (stats.total === 0) return 'Chưa có nhiệm vụ nào được tạo cho tháng này. Hãy lên kế hoạch nhé!';
    if (stats.percent === 100) return 'Tuyệt vời! Tất cả nhiệm vụ tháng này đã hoàn thành xuất sắc! 🎉';
    if (stats.percent >= 70) return 'Tuyệt vời! Sắp hoàn thành tất cả nhiệm vụ rồi, cố gắng lên!';
    if (stats.percent >= 40) return 'Đang tiến triển rất tốt! Hãy tiếp tục phối hợp nhé!';
    return 'Cùng nhau bắt tay thực hiện các công việc chung của nhóm nào! 💪';
  };

  return (
    <div className="space-y-6">
      {/* Overview Headings */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">
            Nhiệm vụ & Công việc
          </h2>
          <p className="text-[#414844] text-sm font-medium mt-1">
            {groupName} - Phân công & Theo dõi công việc hàng tháng
          </p>
        </div>
        <button
          onClick={handleResetToCurrentMonth}
          className="text-xs bg-[#e2e8f8] hover:bg-[#d0d9f0] text-[#151c27] font-semibold px-3.5 py-2 rounded-full tracking-wide transition-colors cursor-pointer select-none self-start md:self-auto shadow-sm"
        >
          Tháng này
        </button>
      </div>

      {/* Month Navigator Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#c1c8c2]/30 shadow-soft">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ChevronLeft size={20} className="stroke-[2.5px]" />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#2c694e]" />
          <span className="font-extrabold text-lg text-[#012d1d] tracking-tight min-w-[130px] text-center font-sans select-none">
            {getMonthLabel(selectedMonth)}
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ChevronRight size={20} className="stroke-[2.5px]" />
        </button>
      </div>

      {/* Progress & Info Card */}
      <div className="bg-gradient-to-br from-[#012d1d] to-[#1b4332] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Decorative background vectors */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#aeeecb]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#95d4b3]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs bg-[#aeeecb]/20 text-[#aeeecb] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              Tiến độ chung
            </span>
            <span className="text-2xl font-black font-mono text-[#aeeecb]">
              {stats.percent}%
            </span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg md:text-xl font-bold tracking-tight">
              {stats.completed}/{stats.total} Nhiệm vụ hoàn thành
            </h3>
            <p className="text-xs md:text-sm text-stone-300 font-medium leading-relaxed flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#aeeecb] shrink-0" />
              {getMotivationalText()}
            </p>
          </div>

          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#aeeecb] to-[#95d4b3] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(174,238,203,0.5)]"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex items-center bg-[#f0f3ff] p-1 rounded-xl border border-stone-200 self-start sm:self-auto shadow-inner">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chưa xong' },
            { id: 'completed', label: 'Đã xong' },
          ].map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#012d1d] shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Add trigger */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-md select-none cursor-pointer border ${
            isAdding
              ? 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
              : 'bg-[#012d1d] hover:bg-[#152b1c] text-white border-transparent'
          }`}
        >
          {isAdding ? 'Đóng' : <><Plus size={14} className="stroke-[2.5px]" /> Thêm nhiệm vụ</>}
        </button>
      </div>

      {/* Add Task Form (Collapsible) */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden bg-white border border-[#c1c8c2]/30 rounded-2xl shadow-soft"
          >
            <form onSubmit={handleAddTask} className="p-5 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-100 pb-2 mb-1">
                <Sparkles size={16} className="text-[#2c694e]" />
                <h4 className="text-sm font-extrabold text-[#012d1d]">Tạo công việc chung mới</h4>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                  Tên nhiệm vụ
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đóng tiền điện tháng 5, Dọn tủ lạnh, Mua xà phòng..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#012d1d] focus:outline-none transition-all"
                />
              </div>

              {/* Assignee Visual Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide block">
                  Người thực hiện (Không bắt buộc)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {members.map((member) => {
                    const isSelected = newAssigneeId === member.uid;
                    return (
                      <button
                        key={member.uid}
                        type="button"
                        onClick={() => setNewAssigneeId(isSelected ? '' : member.uid)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#aeeecb]/30 border-[#2c694e] text-[#012d1d] shadow-sm scale-95'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'
                        }`}
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#012d1d] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span>{member.uid === currentUserId ? 'Bạn' : member.name}</span>
                        {isSelected && <Check size={12} className="text-[#2c694e] stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle('');
                    setNewAssigneeId('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-500 font-bold text-xs hover:bg-stone-50 cursor-pointer select-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="bg-[#012d1d] hover:bg-[#152b1c] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer select-none"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-[#c1c8c2]/20 rounded-2xl py-12 px-6 text-center shadow-soft">
            <ListTodo size={36} className="text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#012d1d]">
              Không tìm thấy nhiệm vụ nào
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {filter === 'all' 
                ? 'Hãy thêm một nhiệm vụ mới để bắt đầu tháng này.' 
                : filter === 'pending' 
                ? 'Tuyệt vời! Không còn nhiệm vụ nào chưa giải quyết.' 
                : 'Chưa có nhiệm vụ nào được đánh dấu hoàn thành.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTasks.map((task) => {
              const creatorName = task.createdBy === currentUserId ? 'Bạn' : (task.createdByName || 'Thành viên');
              const assignee = task.assignedTo ? membersMap[task.assignedTo] : null;
              const formattedDate = new Date(task.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              });

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 flex items-center justify-between p-4 group ${
                    task.completed
                      ? 'border-stone-100 bg-[#f9fafb]'
                      : 'border-[#c1c8c2]/30 hover:border-[#012d1d]/30 shadow-soft hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
                    {/* Custom Checkbox Box */}
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 select-none ${
                        task.completed
                          ? 'border-[#2c694e] bg-[#2c694e] text-white scale-95 shadow-[0_0_6px_rgba(44,105,78,0.3)] animate-pop'
                          : 'border-stone-300 hover:border-[#2c694e] bg-white text-transparent'
                      }`}
                    >
                      <Check size={14} className="stroke-[3px]" />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Title */}
                      <p
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        className={`text-sm font-bold truncate leading-snug cursor-pointer select-none transition-all duration-300 ${
                          task.completed
                            ? 'text-stone-400 line-through decoration-stone-300 opacity-80'
                            : 'text-stone-900 group-hover:text-[#1b4332]'
                        }`}
                      >
                        {task.title}
                      </p>

                      {/* Meta Information Row */}
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] md:text-xs text-stone-400 font-medium">
                        <span>Tạo bởi {creatorName} • {formattedDate}</span>
                        
                        {/* Assignee indicator */}
                        {assignee && (
                          <div className="flex items-center gap-1 bg-[#f0f3ff] text-stone-600 px-2 py-0.5 rounded-full border border-stone-100">
                            {assignee.avatar ? (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                            ) : (
                              <User size={10} className="text-stone-400" />
                            )}
                            <span className="font-semibold text-[9px] md:text-[10px]">
                              {task.assignedTo === currentUserId ? 'Bạn làm' : assignee.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Completed indicator */}
                      {task.completed && (
                        <div className="flex items-center gap-1 text-[10px] text-[#2c694e] font-bold">
                          <CheckCircle2 size={11} />
                          <span>
                            Xong bởi {task.completedBy === currentUserId ? 'Bạn' : (task.completedByName || 'Thành viên')}
                            {task.completedAt && ` lúc ${new Date(task.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-xl text-stone-300 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/20 transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 duration-200"
                      title="Xóa công việc"
                    >
                      <Trash2 size={16} className="stroke-[2px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Chores Tips/Guides */}
      <div className="bg-[#f0f3ff] rounded-2xl p-4 border border-stone-100 flex items-start gap-3 shadow-inner">
        <Info size={18} className="text-[#3a588a] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-extrabold text-[#151c27]">Mẹo cho nhóm chia sẻ</h5>
          <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
            Sử dụng bảng nhiệm vụ hàng tháng để chia đều các công việc chung trong nhà (ví dụ: quét dọn, đổ rác, đóng tiền mạng). Bạn cũng có thể tạo nhiệm vụ quyết toán chi phí của tháng rồi giao cho thành viên thực hiện!
          </p>
        </div>
      </div>
    </div>
  );
}
