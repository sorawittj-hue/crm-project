import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';

const MONTHS = [
  { value: 0, label: 'January', short: 'Jan' },
  { value: 1, label: 'February', short: 'Feb' },
  { value: 2, label: 'March', short: 'Mar' },
  { value: 3, label: 'April', short: 'Apr' },
  { value: 4, label: 'May', short: 'May' },
  { value: 5, label: 'June', short: 'Jun' },
  { value: 6, label: 'July', short: 'Jul' },
  { value: 7, label: 'August', short: 'Aug' },
  { value: 8, label: 'September', short: 'Sep' },
  { value: 9, label: 'October', short: 'Oct' },
  { value: 10, label: 'November', short: 'Nov' },
  { value: 11, label: 'December', short: 'Dec' },
];

export default function MonthSelector({ selectedMonth, selectedYear, onMonthChange, onYearChange, compact = false }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  const handleJumpToCurrent = () => {
    onMonthChange(currentMonth);
    onYearChange(currentYear);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0 rounded-lg hover:bg-white/10"
        >
          <ChevronLeft size={14} />
        </Button>

        <div className="flex items-center gap-2 px-3">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">
            {MONTHS[selectedMonth].short} {selectedYear}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 rounded-lg hover:bg-white/10"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-9 w-9 p-0 rounded-lg hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-3 px-4">
          <Calendar size={16} className="text-muted-foreground" />
          <span className="text-sm font-black uppercase tracking-wider text-foreground">
            {MONTHS[selectedMonth].label} {selectedYear}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-9 w-9 p-0 rounded-lg hover:bg-white/10 transition-all"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleJumpToCurrent}
          className="h-9 px-4 rounded-xl border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-wider"
        >
          Current Month
        </Button>
      )}
    </div>
  );
}
