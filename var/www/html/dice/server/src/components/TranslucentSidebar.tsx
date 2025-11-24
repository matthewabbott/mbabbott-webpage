import React from 'react';

interface TranslucentSidebarProps {
    children: React.ReactNode;
    side: 'left' | 'right';
    className?: string;
}

/**
 * TranslucentSidebar Component
 * Provides a translucent overlay sidebar with backdrop blur effect
 * Used for activity feed and lobby panels that overlay the canvas
 */
const TranslucentSidebar: React.FC<TranslucentSidebarProps> = ({
    children,
    side,
    className = ''
}) => {
    return (
        <div
            className={`
                h-full 
                bg-brand-background/80 
                backdrop-blur-sm 
                ${side === 'left' ? 'border-r' : 'border-l'} 
                border-white/10
                pointer-events-auto
                ${className}
            `}
        >
            <div className="h-full 
                [&_.card]:bg-brand-surface/70 
                [&_.card]:backdrop-blur-sm 
                [&_.card]:border-white/10
                [&_button]:bg-opacity-80 
                [&_button]:backdrop-blur-sm
                [&_input]:bg-opacity-80 
                [&_input]:backdrop-blur-sm
                [&_.bg-brand-surface]:bg-brand-surface/60
                [&_.bg-brand-background]:bg-brand-background/70
                [&_.border-brand-surface]:border-white/10
                [&_.text-brand-text]:text-white/90
                [&_.text-brand-text-muted]:text-white/70
                [&_.bg-orange-900\/20]:bg-orange-900/30
                [&_.bg-blue-600]:bg-blue-600/80
                [&_.bg-green-600]:bg-green-600/80
                [&_.bg-red-600]:bg-red-600/80
                [&_.bg-gray-800]:bg-gray-800/80
                [&_.bg-white]:bg-white/80
            ">
                {children}
            </div>
        </div>
    );
};

export default TranslucentSidebar; 