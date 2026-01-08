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
    const { getNote, updateNote, createNote, deleteNote, isFocusMode, toggleFocusMode, notes } = useStore();

    // ... existing state ...

    // ... existing effects ...

    const handleCreateAndEdit = () => {
        const newId = createNote("# New Idea\n\nStart writing..."); // Changed text to distinguish versions
        navigate(`/editor/${newId}`);
    };

    const handleDelete = () => {
        if (!noteId) return;

        // Find adjacent note before deleting
        const currentIndex = notes.findIndex(n => n.id === noteId);
        let nextNoteId = null;

        if (notes.length > 1) {
            // If there's a next note, take it. Otherwise take previous.
            if (currentIndex < notes.length - 1) {
                nextNoteId = notes[currentIndex + 1].id;
            } else if (currentIndex > 0) {
                nextNoteId = notes[currentIndex - 1].id;
            }
        }

        // Perform delete
        deleteNote(noteId);

        // Navigate
        if (nextNoteId) {
            navigate(`/editor/${nextNoteId}`);
        } else {
            navigate('/editor');
        }

        // Explicit focus
        setTimeout(() => window.focus(), 50);
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
