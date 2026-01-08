import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    PenTool,
    Network,
    Calendar,
    BarChart2,
    Settings,
    Plus,
    Search,
    Layout,
    X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatDistanceToNow } from 'date-fns';
import SettingsModal from '../../modules/settings/SettingsModal';

interface SidebarProps {
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    // destruct settings/updateSettings for future use or pass to modal if needed, 
    // but Modal gets them from context directly. We keep notes/createNote.
    const { notes, createNote } = useStore();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const activeNoteId = pathname.split('/editor/')[1];
    const [search, setSearch] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const filteredNotes = notes
        .filter(n => n.content.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const handleCreate = () => {
        const id = createNote();
        navigate(`/editor/${id}`);
        if (window.innerWidth < 768 && onClose) onClose();
    };

    const navItems = [
        { icon: PenTool, label: 'Zen Editor', path: '/editor' },
        { icon: Network, label: 'Mind Weaver', path: '/weaver' },
        { icon: Layout, label: 'Canvas', path: '/canvas' },
        { icon: Calendar, label: 'Journal', path: '/journal' },
        { icon: BarChart2, label: 'Insights', path: '/dashboard' },
    ];

    return (
        <>
            <div className="h-full w-full glass-panel border-r-0 md:border-r border-t-0 border-b-0 border-l-0 md:rounded-none md:rounded-r-none flex flex-col backdrop-blur-xl bg-white/60 dark:bg-stone-900/60">

                {/* Header */}
                <div className="p-6 flex items-center justify-between drag-region shrink-0">
                    <h1 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 select-none">
                        <span className="text-amber-600 dark:text-amber-400">✦</span> Eunoia
                    </h1>
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 no-drag"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 font-medium'
                                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50'}
            `}
                            onClick={() => window.innerWidth < 768 && onClose && onClose()}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-6 py-4">
                    <div className="h-px w-full bg-stone-200 dark:bg-stone-800" />
                </div>

                {/* Note Action */}
                <div className="px-4 mb-4">
                    <button
                        onClick={handleCreate}
                        className="w-full flex items-center justify-center gap-2 bg-stone-800 dark:bg-stone-100 text-stone-100 dark:text-stone-900 py-3 rounded-xl shadow-lg hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                    >
                        <Plus size={18} />
                        <span>New Note</span>
                    </button>
                </div>

                {/* Search & Recent Notes */}
                <div className="px-4 mb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search thoughts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-100 dark:bg-stone-800/50 rounded-lg border border-transparent focus:border-amber-400 focus:outline-none transition-all placeholder-stone-400 dark:text-stone-200"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2 py-2 CustomScrollbar">
                    {filteredNotes.length === 0 ? (
                        <div className="text-center py-8 text-stone-400 text-sm">
                            No thoughts yet.
                        </div>
                    ) : (

                        filteredNotes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => {
                                    navigate(`/editor/${note.id}`);
                                    if (window.innerWidth < 768 && onClose) onClose();
                                }}
                                className={`
                                    p-3 rounded-lg cursor-pointer group transition-colors
                                    ${note.id === activeNoteId
                                        ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50'
                                        : 'hover:bg-stone-100 dark:hover:bg-stone-800/50 border border-transparent'}
                                `}
                            >
                                <h3 className={`font-medium truncate text-sm ${note.id === activeNoteId ? 'text-amber-900 dark:text-amber-100' : 'text-stone-700 dark:text-stone-300'}`}>
                                    {note.content.split('\n')[0] || 'Untitled'}
                                </h3>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs ${note.id === activeNoteId ? 'text-amber-700/70 dark:text-amber-300/70' : 'text-stone-400'}`}>
                                        {formatDistanceToNow(new Date(note.updatedAt))} ago
                                    </span>
                                    <span className={`text-xs text-amber-600 dark:text-amber-400 transition-opacity ${note.id === activeNoteId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        ➜
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-stone-200 dark:border-stone-800 space-y-1">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-3 px-4 py-2 w-full text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/50"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
};
