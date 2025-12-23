import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Adjust position based on viewport boundaries using actual measurements
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) {
      setAdjustedPosition(position);
      setTooltipStyle({});
      return;
    }

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      if (!tooltipRef.current || !triggerRef.current) return;

      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16; // 1rem padding from edges

      let newPosition = position;
      const style: React.CSSProperties = {};

      // For right/left positions, check horizontal overflow
      if (position === 'right') {
        const rightEdge = triggerRect.right + tooltipRect.width + padding;
        if (rightEdge > viewportWidth) {
          // Would overflow right, try left
          const leftEdge = triggerRect.left - tooltipRect.width - padding;
          if (leftEdge >= 0) {
            newPosition = 'left';
          } else {
            // Both sides overflow, constrain to viewport
            style.right = `${padding}px`;
            style.left = 'auto';
            style.transform = 'translateY(-50%)';
          }
        }
      } else if (position === 'left') {
        const leftEdge = triggerRect.left - tooltipRect.width - padding;
        if (leftEdge < 0) {
          // Would overflow left, try right
          const rightEdge = triggerRect.right + tooltipRect.width + padding;
          if (rightEdge <= viewportWidth) {
            newPosition = 'right';
          } else {
            // Both sides overflow, constrain to viewport
            style.left = `${padding}px`;
            style.right = 'auto';
            style.transform = 'translateY(-50%)';
          }
        }
      }

      // For top/bottom positions, check vertical overflow
      if (position === 'bottom') {
        const bottomEdge = triggerRect.bottom + tooltipRect.height + padding;
        if (bottomEdge > viewportHeight) {
          // Would overflow bottom, try top
          const topEdge = triggerRect.top - tooltipRect.height - padding;
          if (topEdge >= 0) {
            newPosition = 'top';
          } else {
            // Both sides overflow, constrain to viewport
            style.bottom = `${padding}px`;
            style.top = 'auto';
            style.transform = 'translateX(-50%)';
          }
        }
      } else if (position === 'top') {
        const topEdge = triggerRect.top - tooltipRect.height - padding;
        if (topEdge < 0) {
          // Would overflow top, try bottom
          const bottomEdge = triggerRect.bottom + tooltipRect.height + padding;
          if (bottomEdge <= viewportHeight) {
            newPosition = 'bottom';
          } else {
            // Both sides overflow, constrain to viewport
            style.top = `${padding}px`;
            style.bottom = 'auto';
            style.transform = 'translateX(-50%)';
          }
        }
      }

      // For horizontal positions, ensure tooltip doesn't go off-screen
      // Re-measure after position change
      if (newPosition === 'right' || newPosition === 'left') {
        // Force a reflow to get updated measurements
        void tooltip.offsetHeight;
        const updatedRect = tooltip.getBoundingClientRect();
        const tooltipLeft = updatedRect.left;
        const tooltipRight = updatedRect.right;
        
        if (tooltipLeft < padding) {
          // Constrain to left edge
          style.left = `${padding}px`;
          style.right = 'auto';
          style.transform = 'translateY(-50%)';
          newPosition = 'right'; // Keep right positioning class but override with style
        } else if (tooltipRight > viewportWidth - padding) {
          // Constrain to right edge
          style.right = `${padding}px`;
          style.left = 'auto';
          style.transform = 'translateY(-50%)';
          newPosition = 'left'; // Keep left positioning class but override with style
        }
      }

      setAdjustedPosition(newPosition);
      setTooltipStyle(style);
    });
  }, [isVisible, position]);

  const positionStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div ref={triggerRef} className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      <span className="cursor-help">{children}</span>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionStyles[adjustedPosition]} animate-fade-in`}
          style={{
            ...tooltipStyle,
            maxWidth: 'calc(100vw - 2rem)',
            left: tooltipStyle.left !== undefined ? tooltipStyle.left : undefined,
            right: tooltipStyle.right !== undefined ? tooltipStyle.right : undefined,
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <div className="tooltip-content p-3 text-sm" style={{ maxWidth: 'min(20rem, calc(100vw - 2rem))', width: 'max-content' }}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
