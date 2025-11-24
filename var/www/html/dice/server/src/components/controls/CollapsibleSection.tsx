import React, { useState } from 'react';

export interface CollapsibleSectionProps {
    title: string;
    icon?: string;
    tooltip?: string;
    defaultCollapsed?: boolean;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
}

/**
 * CollapsibleSection Component
 * Provides a collapsible section with smooth animations
 * Used for organizing controls and reducing UI clutter
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    tooltip,
    defaultCollapsed = true,
    children,
    className = '',
    headerClassName = '',
    contentClassName = ''
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const toggleCollapsed = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`bg-gray-800 rounded-lg border border-gray-600 ${className}`}>
            {/* Header */}
            <button
                onClick={toggleCollapsed}
                className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700 transition-colors rounded-t-lg ${headerClassName}`}
                title={tooltip}
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-lg">{icon}</span>}
                    <span className="font-medium text-white">{title}</span>
                </div>
                <span className={`text-gray-400 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
                    ▼
                </span>
            </button>

            {/* Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0' : 'max-h-96'}`}>
                <div className={`p-4 border-t border-gray-600 ${contentClassName}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}; 