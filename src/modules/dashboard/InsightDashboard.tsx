// @ts-nocheck
import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { analyzeSentiment, getWordFrequency } from './sentiment';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

const InsightDashboard: React.FC = () => {
    const { notes, settings } = useStore();

    const analytics = useMemo(() => {
        // Sentiment History
        const history = notes
            .map(note => ({
                date: new Date(note.createdAt),
                score: analyzeSentiment(note.content),
                id: note.id,
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(item => ({
                dateStr: format(item.date, 'MMM d'),
                score: parseFloat(item.score.toFixed(2)),
            }));

        // Word Cloud
        const allText = notes.map(n => n.content);
        const words = getWordFrequency(allText);

        // Insights (Top 5 Positive)
        const scoredNotes = notes.map(n => ({
            ...n,
            score: analyzeSentiment(n.content)
        })).sort((a, b) => b.score - a.score);

        const momentsOfClarity = scoredNotes.slice(0, 5).filter(n => n.score > 0);

        // Heatmap Data (Last 365 days)
        const today = new Date();
        const yearAgo = subDays(today, 365);
        const days = eachDayOfInterval({ start: yearAgo, end: today });

        const heatmap = days.map(day => {
            const count = notes.filter(n => isSameDay(new Date(n.updatedAt), day)).length;
            return {
                date: day,
                count,
                level: Math.min(4, count) // 0-4 scale
            };
        });

        // Calculate Streak
        let streak = 0;
        let currentDay = today;
        // Check today first
        if (notes.some(n => isSameDay(new Date(n.updatedAt), currentDay))) {
            streak++;
        }
        // Check backwards
        while (true) {
            currentDay = subDays(currentDay, 1);
            if (notes.some(n => isSameDay(new Date(n.updatedAt), currentDay))) {
                streak++;
            } else {
                break;
            }
        }

        return { history, words, momentsOfClarity, heatmap, streak };
    }, [notes]);

    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <div className="h-full w-full overflow-y-auto CustomScrollbar p-4 md:p-8 space-y-8">
            <header>
                <h2 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100">Insights</h2>
                <p className="text-stone-500 mt-2">patterns in your sanctuary.</p>
            </header>

            {/* Consistency & Streak */}
            <section className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300">Consistency</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-500">Current Streak:</span>
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-500">{analytics.streak} days</span>
                        <span className="text-lg">🔥</span>
                    </div>
                </div>

                <div className="w-full overflow-x-auto CustomScrollbar pb-2">
                    <div className="flex gap-1 min-w-max">
                        {/* Render weeks columns (simplified as just a long flex row for now, or grouped by weeks) */}
                        {/* Let's do a simple grid of 7 rows (weeks) x 52 cols */}
                        <div className="grid grid-rows-7 grid-flow-col gap-1">
                            {analytics.heatmap.map((day) => (
                                <div
                                    key={day.date.toISOString()}
                                    title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} notes`}
                                    className={`
                                        w-3 h-3 rounded-sm transition-colors
                                        ${day.level === 0 ? 'bg-stone-100 dark:bg-stone-800' : ''}
                                        ${day.level === 1 ? 'bg-amber-200 dark:bg-amber-900/40' : ''}
                                        ${day.level === 2 ? 'bg-amber-300 dark:bg-amber-800' : ''}
                                        ${day.level === 3 ? 'bg-amber-400 dark:bg-amber-700' : ''}
                                        ${day.level >= 4 ? 'bg-amber-600 dark:bg-amber-600' : ''}
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Chart */}
            <section className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-6">Emotional Landscape</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                            <XAxis
                                dataKey="dateStr"
                                stroke={isDark ? "#666" : "#999"}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke={isDark ? "#666" : "#999"}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[-4, 4]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#1c1917' : '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    color: isDark ? '#fff' : '#000'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#d97706"
                                strokeWidth={3}
                                dot={{ stroke: '#d97706', strokeWidth: 2, r: 4, fill: isDark ? '#1c1917' : '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Word Cloud */}
                <section className="glass-card p-6 rounded-2xl flex flex-col">
                    <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-6">Recurring Thoughts</h3>
                    <div className="flex-1 flex flex-wrap gap-3 items-center content-center justify-center p-4 min-h-[200px]">
                        {analytics.words.map((word, i) => (
                            <span
                                key={word.text}
                                className="transition-all hover:scale-110 cursor-default text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                                style={{
                                    fontSize: `${Math.max(0.8, Math.min(2.5, 0.8 + word.value * 0.1))}rem`,
                                    opacity: 0.5 + (word.value / analytics.words[0].value) * 0.5,
                                    transform: `rotate(${Math.random() * 10 - 5}deg)`
                                }}
                            >
                                {word.text}
                            </span>
                        ))}
                        {analytics.words.length === 0 && (
                            <p className="text-stone-400 italic">Write more to see patterns emerge...</p>
                        )}
                    </div>
                </section>

                {/* Moments of Clarity */}
                <section className="glass-card p-6 rounded-2xl">
                    <h3 className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-6">Moments of Clarity</h3>
                    <div className="space-y-4">
                        {analytics.momentsOfClarity.map(note => (
                            <div key={note.id} className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-amber-700 dark:text-amber-500 font-bold text-lg">+{note.score.toFixed(1)}</span>
                                    <span className="text-xs text-stone-400">{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                                <p className="text-stone-600 dark:text-stone-300 text-sm line-clamp-2 italic">
                                    "{note.content.substring(0, 100).replace(/\n/g, ' ')}..."
                                </p>
                            </div>
                        ))}
                        {analytics.momentsOfClarity.length === 0 && (
                            <p className="text-stone-400 italic">No highly positive notes found yet.</p>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default InsightDashboard;
