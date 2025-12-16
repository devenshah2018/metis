import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setOffset({ x: 0, y: 0 });
      setActualPosition(position);
    }, 100);
  };

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const updatePosition = () => {
        if (!containerRef.current || !tooltipRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 10;

        let newPosition = position;
        let xOffset = 0;
        let yOffset = 0;

        if (position === 'top') {
          const spaceAbove = containerRect.top;
          const spaceBelow = viewportHeight - containerRect.bottom;
          if (spaceAbove < tooltipRect.height + padding && spaceBelow > spaceAbove) {
            newPosition = 'bottom';
          }
        } else if (position === 'bottom') {
          const spaceBelow = viewportHeight - containerRect.bottom;
          const spaceAbove = containerRect.top;
          if (spaceBelow < tooltipRect.height + padding && spaceAbove > spaceBelow) {
            newPosition = 'top';
          }
        }

        setActualPosition(newPosition);

        setTimeout(() => {
          if (!tooltipRef.current) return;
          const updatedRect = tooltipRef.current.getBoundingClientRect();

          if (updatedRect.left < padding) {
            xOffset = padding - updatedRect.left;
          } else if (updatedRect.right > viewportWidth - padding) {
            xOffset = viewportWidth - padding - updatedRect.right;
          }

          if (updatedRect.top < padding) {
            yOffset = padding - updatedRect.top;
          } else if (updatedRect.bottom > viewportHeight - padding) {
            yOffset = viewportHeight - padding - updatedRect.bottom;
          }

          setOffset({ x: xOffset, y: yOffset });
        }, 0);
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2',
    bottom: 'top-full left-1/2',
    left: 'right-full top-1/2',
    right: 'left-full top-1/2',
  };

  const transformClasses = {
    top: '-translate-x-1/2',
    bottom: '-translate-x-1/2',
    left: '-translate-y-1/2',
    right: '-translate-y-1/2',
  };

  const spacingClasses = {
    top: 'mb-1',
    bottom: 'mt-1',
    left: 'mr-1',
    right: 'ml-1',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-y-1/2 -mb-1 border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-800',
  };

  const arrowBorderClasses = {
    top: 'border-4 border-transparent border-t-gray-800',
    bottom: 'border-4 border-transparent border-b-gray-800',
    left: 'border-4 border-transparent border-l-gray-800',
    right: 'border-4 border-transparent border-r-gray-800',
  };

  const transformStyle = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute ${positionClasses[actualPosition]} ${transformClasses[actualPosition]} ${spacingClasses[actualPosition]} z-50 transition-all duration-200`}
          style={transformStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="bg-gray-800 text-white text-sm rounded-lg py-3 px-4 shadow-2xl border border-gray-700 pointer-events-auto"
            style={{ width: 'min(320px, calc(100vw - 40px))', maxWidth: '320px' }}
          >
            <div className="overflow-y-auto max-h-80 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="space-y-1.5 leading-relaxed">{content}</div>
            </div>
            <div className={`absolute ${arrowClasses[actualPosition]} pointer-events-none`}>
              <div className={arrowBorderClasses[actualPosition]}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
