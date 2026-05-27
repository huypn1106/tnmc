import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function LoginPage() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#012d1d] via-[#1b4332] to-[#2c694e] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#aeeecb]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#95d4b3]/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2c694e]/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#012d1d] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-2xl font-extrabold text-white tracking-tighter select-none">FS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#012d1d] tracking-tight">
              FairShare
            </h1>
            <p className="text-stone-500 text-sm font-medium mt-2 leading-relaxed">
              Quản lý và chia sẻ chi phí nhóm<br />thông minh, tinh tế.
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3 mb-8">
            {[
              { icon: '💸', text: 'Chia hóa đơn tức thì, sòng phẳng' },
              { icon: '👥', text: 'Tạo nhóm, mời bạn bè tham gia' },
              { icon: '📊', text: 'Theo dõi chi tiêu theo thời gian thực' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 bg-[#f0f3ff] rounded-xl px-4 py-3"
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm font-medium text-[#151c27]">{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Sign in button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signIn}
            className="w-full bg-[#012d1d] hover:bg-[#152b1c] text-white py-4 px-6 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Đăng nhập với Google</span>
          </motion.button>

          <p className="text-center text-[10px] text-stone-400 mt-5 leading-relaxed">
            Bằng việc đăng nhập, bạn đồng ý với<br />
            <span className="underline cursor-pointer hover:text-stone-600">Điều khoản sử dụng</span> và{' '}
            <span className="underline cursor-pointer hover:text-stone-600">Chính sách bảo mật</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
