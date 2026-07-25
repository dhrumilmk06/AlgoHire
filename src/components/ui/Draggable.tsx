import React, { useState, useEffect, useRef } from 'react';

interface DraggableProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const Draggable: React.FC<DraggableProps> = ({ children, className = '', style = {} }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const positionStartRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Allow interacting with inputs/buttons
        if (['input', 'button', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
            return;
        }

        e.stopPropagation(); // Stop bubbling to OrbitControls
        e.preventDefault(); // Prevent text selection

        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        positionStartRef.current = { ...position };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.stopPropagation();
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            setPosition({
                x: positionStartRef.current.x + dx,
                y: positionStartRef.current.y + dy
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                e.stopPropagation();
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            className={`${className} cursor-move`}
            style={{
                ...style,
                transform: `translate(${position.x}px, ${position.y}px)`,
                touchAction: 'none',
                width: 'fit-content' // Ensure it wraps content
            }}
            onMouseDown={handleMouseDown}
        >
            {children}
        </div>
    );
};
