export interface Note {
    id: string;
    content: string;
    tags: string[];
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    userName: string;
}

export interface StoreContextType {
    notes: Note[];
    loading: boolean;
    createNote: (content?: string) => string; // Returns new ID
    updateNote: (id: string, content: string) => void;
    deleteNote: (id: string) => void;
    getNote: (id: string) => Note | undefined;
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;
    isFocusMode: boolean;
    toggleFocusMode: () => void;
}
