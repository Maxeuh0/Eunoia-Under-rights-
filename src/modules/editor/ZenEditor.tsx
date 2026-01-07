// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, Eye, EyeOff, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism.css';

const ZenEditor: React.FC = () => {
    const { noteId } = useParams<{ noteId: string }>();
    const navigate = useNavigate();
    const { getNote, updateNote, createNote, deleteNote, isFocusMode, toggleFocusMode } = useStore();

    const [content, setContent] = useState('');
    const [lastSavedContent, setLastSavedContent] = useState('');
    const [isPreviewVisible, setIsPreviewVisible] = useState(true);
    // const [isFocusMode, setIsFocusMode] = useState(false); // Removed local state
    const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    // Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
            // Timer Finished Feedback (Visual Pulse)
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); // Silent base just for object, or actually play a bell if I had one. 
            // For now, let's just use a visual cue by setting status or similar.
            // Using a simple beep helper or just notification API if allowed.
            if (Notification.permission === 'granted') {
                new Notification("Flow Session Complete");
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') new Notification("Flow Session Complete");
                });
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setTimerActive(!timerActive);
    const resetTimer = () => {
        setTimerActive(false);
        setTimeLeft(25 * 60);
    };

    // Load note
    const lastLoadedId = React.useRef<string | null>(null);

    // Load note
    useEffect(() => {
        if (noteId) {
            // Only load if it's a DIFFERENT note than what we last loaded
            if (noteId !== lastLoadedId.current) {
                const note = getNote(noteId);
                if (note) {
                    setContent(note.content);
                    setLastSavedContent(note.content);
                    lastLoadedId.current = noteId;
                }
                // Don't navigate away immediately if not found.
                // React state updates might be pending.
                // The logical "Not Found" handling can be done in render if needed.
            }
        } else {
            setContent('');
            setLastSavedContent('');
            lastLoadedId.current = null;
        }
    }, [noteId, getNote]);

    // Autosave Logic
    useEffect(() => {
        if (!noteId || content === lastSavedContent) return;

        setStatus('unsaved');
        const timer = setTimeout(() => {
            setStatus('saving');
            updateNote(noteId, content);
            setLastSavedContent(content);
            setTimeout(() => setStatus('saved'), 500);
        }, 1500);

        return () => clearTimeout(timer);
    }, [content, noteId, lastSavedContent, updateNote]);

    // Ctrl+S Handler (Reassuring Save)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (noteId) {
                    setStatus('saving');
                    updateNote(noteId, content);
                    setLastSavedContent(content);
                    setTimeout(() => setStatus('saved'), 500);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, noteId, updateNote]);

    const handleCreateAndEdit = () => {
        const newId = createNote("# New Thought\n\nStart writing...");
        navigate(`/editor/${newId}`);
    };

    const handleDelete = () => {
        // REMOVED window.confirm temporarily to debug focus loss issue.
        // Native dialogs in Electron can sometimes steal focus permanently until clicked.
        if (noteId) {
            deleteNote(noteId);
            navigate('/editor');
            // Explicitly reclaim focus for the main window
            window.focus();
        }
    };

    const safeHighlight = (code: string) => {
        try {
            return Prism.highlight(code || '', Prism.languages.markdown, 'markdown');
        } catch (e) {
            console.error(e);
            return code;
        }
    };

    // Force focus on mount
    useEffect(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        }
    }, [noteId]);

    if (!noteId) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-stone-500 gap-4">
                <p className="text-xl font-serif">Select a thought from the text, or...</p>
                <button
                    onClick={handleCreateAndEdit}
                    className="px-6 py-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition"
                >
                    Create New Thought
                </button>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col relative ${isFocusMode ? 'fixed inset-0 z-50 bg-stone-50 dark:bg-stone-900 p-8 md:px-32' : ''}`}>

            {/* Toolbar */}
            <div className={`flex items-center justify-between mb-4 px-2 transition-opacity duration-300 ${isFocusMode ? 'opacity-80 hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    {/* Status */}
                    <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                        {status === 'saved' && <><Save size={14} /> Saved</>}
                        {status === 'saving' && <span className="animate-pulse">Saving...</span>}
                        {status === 'unsaved' && <span className="text-amber-500">Unsaved changes</span>}
                    </div>

                    {/* Focus Timer */}
                    <div className="flex items-center gap-2 bg-white dark:bg-stone-800 rounded-full px-3 py-1 shadow-sm border border-stone-100 dark:border-stone-700">
                        <span className={`font-mono text-sm font-bold ${timerActive ? 'text-amber-600 animate-pulse' : 'text-stone-500'}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <div className="flex gap-1">
                            <button onClick={toggleTimer} className="p-1 hover:text-amber-600 text-stone-400 transition">
                                {timerActive ? <span className="text-xs">⏸</span> : <span className="text-xs">▶</span>}
                            </button>
                            <button onClick={resetTimer} className="p-1 hover:text-red-500 text-stone-400 transition">
                                <span className="text-xs">↺</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        className="p-2 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 rounded-lg text-stone-500 transition mr-2"
                        title="Delete Note"
                    >
                        <Trash2 size={18} />
                    </button>

                    <button
                        onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-stone-500 transition"
                        title="Toggle Preview"
                    >
                        {isPreviewVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    <button
                        onClick={toggleFocusMode}
                        className={`p-2 rounded-lg transition ${isFocusMode ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500'}`}
                        title="Focus Mode"
                    >
                        {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex gap-4 overflow-hidden relative z-0">

                {/* Input */}
                <div className={`
          h-full overflow-y-auto CustomScrollbar transition-all duration-300 relative z-10
          ${isPreviewVisible ? 'w-1/2' : 'w-full max-w-3xl mx-auto'}
          bg-stone-100/50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-stone-800
        `}>
                    <Editor
                        key={noteId} // FORCE REMOUNT on note change
                        value={content || ''}
                        onValueChange={setContent}
                        highlight={safeHighlight}
                        padding={24}
                        autoFocus
                        className="font-mono text-base min-h-full outline-none"
                        textareaClassName="focus:outline-none"
                        style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 16,
                            lineHeight: '1.6',
                        }}
                    />
                </div>


                {/* Preview */}
                {isPreviewVisible && (
                    <div className="w-1/2 h-full overflow-y-auto CustomScrollbar p-6 prose prose-stone dark:prose-invert prose-lg">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }: any) => <h1 className="font-serif text-4xl mb-6 text-amber-700 dark:text-amber-500" {...props} />,
                                h2: ({ node, ...props }: any) => <h2 className="font-serif text-2xl mb-4 mt-8 text-stone-700 dark:text-stone-300" {...props} />,
                                p: ({ node, ...props }: any) => <p className="mb-4 leading-relaxed opacity-90" {...props} />,
                                blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-amber-500 pl-4 italic bg-amber-50 dark:bg-amber-900/20 p-4 rounded-r-lg my-4" {...props} />,
                            }}
                        >
                            {content || "*Empty canvas...*"}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZenEditor;
