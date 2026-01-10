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
    X,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Music
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

    // Music Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [files, setFiles] = useState<string[]>([]);

    // Initial Load Logic
    React.useEffect(() => {
        const loadMusic = async () => {
            try {
                // @ts-ignore
                const musicFiles = await window.electron.getBundledMusic();
                if (musicFiles && musicFiles.length > 0) {
                    setFiles(musicFiles);
                    if (audioRef.current) {
                        audioRef.current.src = `music://${musicFiles[0]}`;
                        audioRef.current.volume = 0.3;
                    }
                }
            } catch (e) {
                console.error("Failed to load bundled music", e);
            }
        };
        loadMusic();
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const playNext = () => {
        if (files.length === 0) return;
        const nextIndex = (currentTrackIndex + 1) % files.length;
        changeTrack(nextIndex);
    };

    const playPrev = () => {
        if (files.length === 0) return;
        const prevIndex = (currentTrackIndex - 1 + files.length) % files.length;
        changeTrack(prevIndex);
    };

    const changeTrack = (index: number) => {
        setCurrentTrackIndex(index);
        if (audioRef.current && files.length > 0) {
            audioRef.current.src = `music://${files[index]}`;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

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

                {/* Music Player */}
                <div className="px-4 py-2 border-t border-stone-200 dark:border-stone-800">
                    <div className={`
                        rounded-xl p-3 transition-all duration-300
                        ${files.length > 0 ? 'bg-stone-100 dark:bg-stone-800/80' : 'hidden'}
                    `}>
                        {files.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between overflow-hidden">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-stone-200 text-stone-500'}`}>
                                            <Music size={14} />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 truncate w-24">
                                                {files[currentTrackIndex]?.split(/[/\\]/).pop()}
                                            </span>
                                            <span className="text-[10px] text-stone-500 truncate w-24">
                                                {files.length} tracks
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <button onClick={playPrev} className="text-stone-400 hover:text-amber-600 transition">
                                        <SkipBack size={14} />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        className="w-8 h-8 flex items-center justify-center bg-stone-800 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-full hover:scale-105 transition-transform shadow-md"
                                    >
                                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                    </button>
                                    <button onClick={playNext} className="text-stone-400 hover:text-amber-600 transition">
                                        <SkipForward size={14} />
                                    </button>
                                </div>

                                {/* Hidden Audio Element */}
                                <audio
                                    ref={audioRef}
                                    onEnded={playNext}
                                    onError={(e) => console.error("Audio Error", e)}
                                />
                            </div>
                        )}
                    </div>
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
