// @ts-nocheck
import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

const JournalView: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { notes, createNote } = useStore();
    const navigate = useNavigate();

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getNotesForDay = (day: Date) => {
        return notes.filter(note =>
            isSameDay(new Date(note.createdAt), day) ||
            isSameDay(new Date(note.updatedAt), day)
        );
    };

    const handleDayClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const journalTitle = `# Journal - ${dateStr}`;

        // Check if journal entry exists
        const existingEntry = notes.find(n => n.content.startsWith(journalTitle));

        if (existingEntry) {
            navigate(`/editor/${existingEntry.id}`);
        } else {
            const newId = createNote(`${journalTitle}\n\n`);
            navigate(`/editor/${newId}`);
        }
    };

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 flex items-center gap-4">
                    <span className="capitalize">{format(currentMonth, 'MMMM yyyy')}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition"><ChevronLeft /></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition"><ChevronRight /></button>
                </div>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 mb-4">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-stone-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2 md:gap-4">
                {days.map((day, dayIdx) => {
                    const dayNotes = getNotesForDay(day);
                    const hasActivity = dayNotes.length > 0;
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            className={`
                relative p-2 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-start pt-4 group
                ${isCurrentMonth ? 'bg-white/40 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/50 hover:bg-white/80 dark:hover:bg-stone-800' : 'bg-transparent border-transparent text-stone-300 dark:text-stone-700'}
                ${isToday(day) ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-stone-900' : ''}
              `}
                        >
                            <span className={`text-lg font-serif ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                                {format(day, 'd')}
                            </span>

                            {/* Activity Dots */
                                hasActivity && isCurrentMonth && (
                                    <div className="flex gap-1 mt-2 flex-wrap justify-center max-w-[80%]">
                                        {dayNotes.slice(0, 3).map(n => (
                                            <div key={n.id} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        ))}
                                        {dayNotes.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
                                    </div>
                                )}

                            {/* Hover Effect */}
                            {isCurrentMonth && (
                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JournalView;
