import React from 'react';
import { Sidebar } from './Sidebar';
import ParticleBackground from './ParticleBackground';
import { Menu } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return <LayoutContent>{children}</LayoutContent>;
};

// Moving to inner component to safely use hook
import { useStore } from '../../context/StoreContext';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isFocusMode } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full relative overflow-hidden">
            <ParticleBackground />

            {/* Global Drag Bar */}
            <div className={`absolute top-0 left-0 right-0 h-8 z-30 drag-region ${isFocusMode ? 'hidden' : ''}`} />

            {/* Mobile Toggle - Hidden in Focus Mode */}
            {!isFocusMode && (
                <button
                    className="absolute top-4 left-4 z-50 md:hidden p-2 rounded-full glass-card no-drag"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Sidebar - Hidden in Focus Mode */}
            <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen && !isFocusMode ? 'translate-x-0' : '-translate-x-full'}
        md:relative ${isFocusMode ? 'md:-ml-64' : 'md:translate-x-0'}
        w-64 h-full transition-all duration-500
      `}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main className={`flex-1 h-full overflow-hidden p-4 md:p-8 relative transition-all duration-500 ${isFocusMode ? 'scale-100 p-0 md:p-0' : ''}`}>
                <div className={`w-full h-full glass-panel rounded-3xl overflow-hidden shadow-2xl animate-fade-in ${isFocusMode ? '!rounded-none border-0' : ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
