import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CalendarDays, Check } from 'lucide-react';

interface MonthFilterProps {
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  availableMonths: string[];
}

export default function MonthFilter({ selectedMonth, onChangeMonth, availableMonths }: MonthFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatMonthLabel = (m: string) => {
    if (m === 'all') return 'Tất cả thời gian';
    try {
      const [year, month] = m.split('-');
      return `Tháng ${parseInt(month, 10)}, ${year}`;
    } catch (e) {
      return m;
    }
  };

  const options = ['all', ...availableMonths];

  return (
    <div 
      className="flex items-center gap-3 mb-6 select-none bg-white p-2.5 md:p-3.5 rounded-2xl border border-[#c1c8c2]/50 shadow-sm w-full md:w-max relative" 
      ref={dropdownRef}
    >
      <div className="w-10 h-10 rounded-full bg-[#f0f3ff] text-[#012d1d] flex items-center justify-center shrink-0">
        <CalendarDays size={18} />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-none mb-1.5">
          Thời gian hiển thị
        </span>
        <div 
          className="relative shrink-0 flex items-center cursor-pointer group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="py-0.5 pl-0 pr-6 text-sm md:text-base font-extrabold text-[#012d1d] w-full">
            {formatMonthLabel(selectedMonth)}
          </span>
          <ChevronDown size={16} className={`absolute right-0 text-[#012d1d] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full md:w-56 bg-white border border-[#c1c8c2]/50 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto hide-scrollbar">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChangeMonth(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors ${
                  selectedMonth === opt 
                    ? 'bg-[#f0f3ff] text-[#012d1d]' 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span>{formatMonthLabel(opt)}</span>
                {selectedMonth === opt && <Check size={16} className="text-[#012d1d] stroke-[3px]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
