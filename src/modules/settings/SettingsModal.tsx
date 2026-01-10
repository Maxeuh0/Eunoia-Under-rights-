import React, { useEffect, useState, useCallback } from 'react';
import { X, Moon, Sun, Coffee, Monitor, RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UpdateStatus {
    status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'ready' | 'error' | 'dev-mode';
    version?: string;
    percent?: number;
    message?: string;
}

// Declare electron API type
declare global {
    interface Window {
        electron?: {
            versions: Record<string, string>;
            checkForUpdates: () => Promise<{ status: string; version?: string; message?: string }>;
            installUpdate: () => void;
            getAppVersion: () => Promise<string>;
            onUpdateStatus: (callback: (data: UpdateStatus) => void) => () => void;
        };
    }
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings } = useStore();
    const [isVisible, setIsVisible] = useState(false);
    const [appVersion, setAppVersion] = useState('0.1.13');
    const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' });

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Get app version when modal opens
            if (window.electron?.getAppVersion) {
                window.electron.getAppVersion().then(setAppVersion);
            }
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Listen for update status changes
    useEffect(() => {
        if (window.electron?.onUpdateStatus) {
            const cleanup = window.electron.onUpdateStatus((data) => {
                setUpdateStatus(data);
            });
            return cleanup;
        }
    }, []);

    const handleCheckUpdates = useCallback(async () => {
        if (!window.electron?.checkForUpdates) {
            setUpdateStatus({ status: 'dev-mode' });
            return;
        }
        setUpdateStatus({ status: 'checking' });
        try {
            const result = await window.electron.checkForUpdates();
            if (result.status === 'dev-mode') {
                setUpdateStatus({ status: 'dev-mode' });
            }
        } catch (error) {
            setUpdateStatus({ status: 'error', message: 'Failed to check for updates' });
        }
    }, []);

    const handleInstallUpdate = useCallback(() => {
        if (window.electron?.installUpdate) {
            window.electron.installUpdate();
        }
    }, []);

    const getUpdateStatusDisplay = () => {
        switch (updateStatus.status) {
            case 'checking':
                return (
                    <div className="flex items-center gap-2 text-stone-500">
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Checking for updates...</span>
                    </div>
                );
            case 'available':
                return (
                    <div className="flex items-center gap-2 text-amber-600">
                        <Download size={16} />
                        <span>Update {updateStatus.version} available!</span>
                    </div>
                );
            case 'downloading':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Download size={16} className="animate-pulse" />
                            <span>Downloading... {updateStatus.percent}%</span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                            <div
                                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${updateStatus.percent || 0}%` }}
                            />
                        </div>
                    </div>
                );
            case 'ready':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <span>Update {updateStatus.version} ready to install!</span>
                    </div>
                );
            case 'not-available':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <span>You're up to date!</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle size={16} />
                        <span>{updateStatus.message || 'Update error'}</span>
                    </div>
                );
            case 'dev-mode':
                return (
                    <div className="flex items-center gap-2 text-stone-400">
                        <AlertCircle size={16} />
                        <span>Updates disabled in dev mode</span>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-500/20 dark:bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`
                w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl 
                border border-stone-200 dark:border-stone-800 overflow-hidden
                transform transition-all duration-300
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
                    <h2 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Theme Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Appearance</h3>

                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => updateSettings({ theme: 'light' })}
                                className={`
                                    flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                                    ${settings.theme === 'light'
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                                        : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400'}
                                `}
                            >
                                <Sun size={24} />
                                <span className="text-sm font-medium">Light</span>
                            </button>

                            <button
                                onClick={() => updateSettings({ theme: 'dark' })}
                                className={`
                                    flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                                    ${settings.theme === 'dark'
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                                        : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400'}
                                `}
                            >
                                <Moon size={24} />
                                <span className="text-sm font-medium">Dark</span>
                            </button>

                            <button
                                onClick={() => updateSettings({ theme: 'system' })}
                                className={`
                                    flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                                    ${settings.theme === 'system'
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                                        : 'bg-stone-50 dark:bg-stone-800 border-transparent hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400'}
                                `}
                            >
                                <Monitor size={24} />
                                <span className="text-sm font-medium">System</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 dark:bg-stone-800 my-6" />

                    {/* Updates Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Updates</h3>

                        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-stone-700 dark:text-stone-300">Current version</span>
                                <span className="font-mono text-stone-500">v{appVersion}</span>
                            </div>

                            {getUpdateStatusDisplay()}

                            <div className="flex gap-2">
                                {updateStatus.status === 'ready' ? (
                                    <button
                                        onClick={handleInstallUpdate}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <RefreshCw size={16} />
                                        Install & Restart
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCheckUpdates}
                                        disabled={updateStatus.status === 'checking' || updateStatus.status === 'downloading'}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                    >
                                        <RefreshCw size={16} className={updateStatus.status === 'checking' ? 'animate-spin' : ''} />
                                        Check for Updates
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 dark:bg-stone-800 my-6" />

                    {/* Support Section */}
                    {/* Support Section - Temporarily hidden */}
                    {false && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Support</h3>

                            <a
                                href={atob('aHR0cHM6Ly9idXltZWFjb2ZmZWUuY29tL01heGV1aDA=') /* Basic Obfuscation */}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group border border-amber-100 dark:border-amber-900/30"
                            >
                                <div className="p-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm text-amber-600 group-hover:scale-110 transition-transform duration-300">
                                    <Coffee size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-stone-900 dark:text-stone-100">Support the Creator</h4>
                                    <p className="text-sm text-stone-500 dark:text-stone-400">Secure donation link.</p>
                                </div>
                            </a>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-xs text-stone-400">Eunoia v{appVersion} • © 2026 Eunoia Team. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
