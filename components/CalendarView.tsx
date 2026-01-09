import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to get days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const jumpToday = () => setCurrentDate(new Date());

  // Generate grid cells
  const renderCalendarCells = useMemo(() => {
    const cells = [];
    
    // Empty padding cells for start of month
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-900/30 border border-gray-800/50"></div>);
    }

    // Actual day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      
      const dayEvents = events.filter(e => e.date === dateStr);

      cells.push(
        <div key={d} className={`min-h-[100px] p-2 border border-gray-800/50 relative hover:bg-gray-800/50 transition-colors ${isToday ? 'bg-gray-800/80' : 'bg-gray-900/50'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-accent-600 text-white' : 'text-gray-400'}`}>
              {d}
            </span>
          </div>
          
          <div className="space-y-1">
            {dayEvents.map(ev => (
              <div key={ev.id} className="text-[10px] px-2 py-1 rounded bg-accent-500/20 border border-accent-500/30 text-accent-100 truncate hover:bg-accent-500/30 cursor-pointer" title={`${ev.time} - ${ev.title}`}>
                <span className="font-bold mr-1">{ev.time}</span>
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  }, [year, month, events, daysInMonth, startDay]);

  return (
    <div className="flex flex-col h-full bg-gray-950/20 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight">{MONTHS[month]} <span className="text-gray-500">{year}</span></h2>
           <p className="text-gray-400 text-sm mt-1">
             {events.length} events scheduled
           </p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
           <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
              ←
           </button>
           <button onClick={jumpToday} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              Today
           </button>
           <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
              →
           </button>
        </div>
      </div>

      <div className="w-full h-full flex flex-col bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-gray-900 border-b border-gray-800">
           {DAYS.map(day => (
             <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
               {day}
             </div>
           ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr flex-1">
           {renderCalendarCells}
        </div>
      </div>
    </div>
  );
};
