import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: string;
    content: React.ReactNode;
}

interface TabbedPanelProps {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
    onTabChange?: (tabId: string) => void;
}

/**
 * TabbedPanel Component
 * Provides a generic tabbed interface for organizing content
 * Used for the lobby panel to switch between Lobby and User Settings
 */
const TabbedPanel: React.FC<TabbedPanelProps> = ({
    tabs,
    defaultTab,
    className = '',
    onTabChange
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        onTabChange?.(tabId);
    };

    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className={`h-full flex flex-col ${className}`}>
            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 bg-brand-surface/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
              flex-1 
              px-4 
              py-3 
              text-sm 
              font-medium 
              transition-colors 
              border-b-2 
              ${activeTab === tab.id
                                ? 'text-brand-text border-brand-primary bg-brand-background/30'
                                : 'text-brand-text-muted border-transparent hover:text-brand-text hover:bg-brand-background/20'
                            }
            `}
                        title={`Switch to ${tab.label} tab`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {tab.icon && <span className="text-lg">{tab.icon}</span>}
                            <span>{tab.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-grow min-h-0 overflow-y-auto">
                {activeTabContent}
            </div>
        </div>
    );
};

export default TabbedPanel;
export type { Tab, TabbedPanelProps }; 