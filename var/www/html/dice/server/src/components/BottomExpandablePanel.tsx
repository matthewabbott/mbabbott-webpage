import React, { useState } from 'react';

interface BottomExpandablePanelProps {
    title: string;
    icon?: string;
    defaultExpanded?: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * BottomExpandablePanel Component
 * Provides a panel that expands upward from the bottom of the screen
 * Used for local sandbox controls that overlay the canvas
 */
const BottomExpandablePanel: React.FC<BottomExpandablePanelProps> = ({
    title,
    icon,
    defaultExpanded = false,
    children,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`absolute bottom-0 left-0 right-0 z-20 ${className}`}>
            {/* Toggle Button */}
            <button
                onClick={toggleExpanded}
                className="w-full bg-brand-surface/90 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex items-center justify-between text-left hover:bg-brand-surface transition-colors"
                title={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-lg">{icon}</span>}
                    <span className="font-medium text-brand-text">{title}</span>
                </div>
                <span
                    className={`text-brand-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'
                        }`}
                >
                    ▲
                </span>
            </button>

            {/* Expandable Content */}
            <div
                className={`
          overflow-hidden 
          transition-all 
          duration-300 
          ease-in-out 
          bg-brand-surface/90 
          backdrop-blur-sm 
          border-t 
          border-white/10
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
            >
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomExpandablePanel; 