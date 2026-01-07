// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Note, StoreContextType, UserSettings } from '../types';

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY_NOTES = 'eunoia_notes';
const STORAGE_KEY_SETTINGS = 'eunoia_settings';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'system',
        userName: 'Traveler',
    });
    const [loading, setLoading] = useState(true);

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
            if (savedNotes) {
                setNotes(JSON.parse(savedNotes));
            }

            const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (e) {
            console.error("Failed to load data from local storage", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
        }
    }, [notes, loading]);

    useEffect(() => {
        if (!loading) {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

            // Apply theme to document
            const root = window.document.documentElement;
            const isDark = settings.theme === 'dark' ||
                (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [settings, loading]);

    const extractTags = (content: string): string[] => {
        const hashRegex = /#([a-zA-Z0-9_]+)/g;
        const matches = content.match(hashRegex);
        if (!matches) return [];
        return Array.from(new Set(matches.map(tag => tag.substring(1)))); // Remove # and dedupe
    };

    const createNote = useCallback((content: string = '') => {
        const newNote: Note = {
            id: uuidv4(),
            content,
            tags: extractTags(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        return newNote.id;
    }, []);

    const updateNote = useCallback((id: string, content: string) => {
        setNotes(prev => prev.map(note => {
            if (note.id === id) {
                return {
                    ...note,
                    content,
                    tags: extractTags(content),
                    updatedAt: new Date().toISOString(),
                };
            }
            return note;
        }));
    }, []);

    const deleteNote = useCallback((id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    }, []);

    const getNote = useCallback((id: string) => {
        return notes.find(n => n.id === id);
    }, [notes]);

    const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const [isFocusMode, setIsFocusMode] = useState(false);
    const toggleFocusMode = useCallback(() => setIsFocusMode(prev => !prev), []);

    const value = React.useMemo(() => ({
        notes,
        loading,
        createNote,
        updateNote,
        deleteNote,
        getNote,
        settings,
        updateSettings,
        isFocusMode,
        toggleFocusMode
    }), [notes, loading, createNote, updateNote, deleteNote, getNote, settings, updateSettings, isFocusMode, toggleFocusMode]);

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
