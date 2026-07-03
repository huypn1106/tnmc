import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  StickyNote, 
  Sparkles,
  Info,
  Edit2
} from 'lucide-react';
import { Note, GroupMember } from '../types';
import { addNote, deleteNote, updateNote } from '../lib/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface NotesProps {
  groupId: string;
  notes: Note[];
  error?: any;
  membersMap: Record<string, GroupMember>;
  currentUserId: string;
  groupName: string;
}

export default function Notes({ 
  groupId, 
  notes, 
  error,
  membersMap, 
  currentUserId, 
  groupName 
}: NotesProps) {
  // Render gorgeous Firestore rules config notice if permissions are missing
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">
              Ghi chú Nhóm
            </h2>
            <p className="text-[#414844] text-sm font-medium mt-1">
              {groupName} - Chia sẻ thông tin quan trọng
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
                Quy tắc bảo mật (Firestore Security Rules) của dự án hiện chưa cho phép truy cập subcollection <code className="bg-[#ba1a1a]/10 px-1 py-0.5 rounded font-mono">notes</code>.
              </p>
            </div>
          </div>
          
          <div className="bg-white/95 rounded-2xl p-5 text-xs border border-red-100 text-stone-700 space-y-3 leading-relaxed shadow-inner">
            <p className="font-bold text-[#ba1a1a] flex items-center gap-1.5">
              💡 Vui lòng thêm quy tắc truy cập sau trên Firebase Console &gt; Firestore Database &gt; Rules:
            </p>
            <pre className="overflow-x-auto p-3 bg-stone-50 rounded-xl border border-stone-200 font-mono text-[10px] md:text-xs text-stone-600 leading-normal">
{`// THÊM ĐOẠN NÀY ĐỂ CHO PHÉP TÍNH NĂNG GHI CHÚ:
match /notes/{noteId} {
  allow read, write: if request.auth != null;
}`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add / Edit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (editingNoteId) {
        await updateNote(groupId, editingNoteId, {
          title: title.trim(),
          content: content.trim()
        });
      } else {
        await addNote(groupId, {
          title: title.trim(),
          content: content.trim(),
          createdBy: currentUserId,
        });
      }

      setTitle('');
      setContent('');
      setIsAdding(false);
      setEditingNoteId(null);
    } catch (error) {
      console.error('Lỗi khi lưu ghi chú:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      await deleteNote(groupId, noteId, currentUserId);
    } catch (error) {
      console.error('Lỗi khi xóa ghi chú:', error);
    }
  };

  const handleEditClick = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingNoteId(note.id);
    setIsAdding(true);
    // scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Overview Headings */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#012d1d] tracking-tight">
            Ghi chú Nhóm
          </h2>
          <p className="text-[#414844] text-sm font-medium mt-1">
            {groupName} - Lưu trữ các thông tin quan trọng chung
          </p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              handleCancelForm();
            } else {
              setIsAdding(true);
            }
          }}
          className={`flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-md select-none cursor-pointer border ${
            isAdding
              ? 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
              : 'bg-[#012d1d] hover:bg-[#152b1c] text-white border-transparent'
          }`}
        >
          {isAdding ? 'Đóng form' : <><Plus size={14} className="stroke-[2.5px]" /> Thêm ghi chú</>}
        </button>
      </div>

      {/* Add / Edit Form (Collapsible) */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden bg-white border border-[#c1c8c2]/30 rounded-2xl shadow-soft"
          >
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-100 pb-3 mb-2">
                <Sparkles size={18} className="text-[#2c694e]" />
                <h4 className="text-base font-extrabold text-[#012d1d]">
                  {editingNoteId ? 'Chỉnh sửa Ghi chú' : 'Tạo Ghi chú mới'}
                </h4>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: STK Đóng Tiền Nhà, Pass Wifi..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#012d1d] focus:outline-none transition-all font-semibold text-stone-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wide block">
                  Nội dung chi tiết
                </label>
                <textarea
                  required
                  placeholder="Nhập nội dung ghi chú..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full bg-[#f8f9fc] border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#012d1d] focus:outline-none transition-all text-stone-700 resize-y min-h-[100px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-500 font-bold text-xs hover:bg-stone-50 cursor-pointer select-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="bg-[#012d1d] hover:bg-[#152b1c] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer select-none"
                >
                  {isSubmitting ? 'Đang lưu...' : (editingNoteId ? 'Lưu thay đổi' : 'Tạo ghi chú')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="bg-white border border-[#c1c8c2]/20 rounded-2xl py-12 px-6 text-center shadow-soft mt-4">
            <StickyNote size={40} className="text-stone-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-[#012d1d]">
              Chưa có ghi chú nào
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Thêm ghi chú để lưu lại thông tin chuyển khoản, wifi, hoặc quy định chung của nhóm.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => {
              const creatorName = note.createdBy === currentUserId ? 'Bạn' : (membersMap[note.createdBy]?.name || 'Thành viên');
              const formattedDate = new Date(note.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              
              return (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl border border-stone-200 hover:border-[#012d1d]/30 shadow-sm hover:shadow-md transition-all duration-300 p-5 group flex flex-col relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#aeeecb]/20 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
                    <h3 className="font-extrabold text-[#012d1d] text-base leading-tight break-words pr-8">
                      {note.title}
                    </h3>
                    
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleEditClick(note)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#012d1d] hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Sửa"
                      >
                        <Edit2 size={14} className="stroke-[2.5px]" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={14} className="stroke-[2.5px]" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-stone-600 mb-5 whitespace-pre-wrap flex-grow font-medium leading-relaxed relative z-10">
                    {note.content}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-stone-100 text-[10px] md:text-xs text-stone-400 font-medium w-full relative z-10">
                    {membersMap[note.createdBy]?.avatar ? (
                      <img
                        src={membersMap[note.createdBy].avatar}
                        alt={creatorName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-[#012d1d] text-white flex items-center justify-center text-[8px] font-bold">
                        {creatorName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">Tạo bởi {creatorName}</span>
                    <span className="text-stone-300">•</span>
                    <span className="shrink-0">{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Tips */}
      <div className="bg-[#f0f3ff] rounded-2xl p-4 border border-stone-100 flex items-start gap-3 shadow-inner">
        <Info size={18} className="text-[#3a588a] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="text-xs font-extrabold text-[#151c27]">Sử dụng Ghi chú</h5>
          <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
            Nơi hoàn hảo để lưu thông tin ngân hàng, mật khẩu wifi, số điện thoại chủ nhà hoặc những quy tắc chung của nhóm. Tất cả thành viên đều có thể xem và chỉnh sửa.
          </p>
        </div>
      </div>
    </div>
  );
}
