import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isSameDay, subYears, subMonths, subWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const TimeCapsuleModal = () => {
    const { notes } = useStore();
    const navigate = useNavigate();
    const [memory, setMemory] = useState<{ note: any, type: string } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Run once on mount
        const today = new Date();
        const oneYearAgo = subYears(today, 1);
        const oneMonthAgo = subMonths(today, 1);
        const oneWeekAgo = subWeeks(today, 1);

        const findMemory = () => {
            // Prioritize 1 Year -> 1 Month -> 1 Week
            const yearNote = notes.find(n => isSameDay(new Date(n.createdAt), oneYearAgo));
            if (yearNote) return { note: yearNote, type: '1 Year Ago' };

            const monthNote = notes.find(n => isSameDay(new Date(n.createdAt), oneMonthAgo));
            if (monthNote) return { note: monthNote, type: '1 Month Ago' };

            const weekNote = notes.find(n => isSameDay(new Date(n.createdAt), oneWeekAgo));
            if (weekNote) return { note: weekNote, type: '1 Week Ago' };

            return null;
        };

        const found = findMemory();
        if (found) {
            // Check if we already showed it today (optional, but good UX)
            // For now, let's just show it every time app reloads to demonstrate feature
            setMemory(found);
            setIsVisible(true);
        }
    }, [notes]);

    if (!isVisible || !memory) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in duration-300">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                        <Clock size={24} />
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">
                        Time Capsule
                    </h2>
                    <p className="text-stone-500 mb-6 font-medium uppercase tracking-wider text-xs">
                        From {memory.type}
                    </p>

                    <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-xl w-full text-left mb-6 italic text-stone-600 dark:text-stone-300 relative overflow-hidden group cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        onClick={() => {
                            navigate(`/editor/${memory.note.id}`);
                            setIsVisible(false);
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-50 dark:to-stone-900 opacity-50 pointer-events-none" />
                        "{memory.note.content.substring(0, 150)}..."
                        <p className="text-xs text-amber-600 mt-4 font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Read full thought ➜
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
