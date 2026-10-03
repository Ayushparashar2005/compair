import { useEffect, useState, useRef } from 'react';

interface StatHighlightProps {
  children: React.ReactNode;
  trigger: any; // Used to re-trigger the animation when question changes
}

export function StatHighlight({ children, trigger }: StatHighlightProps) {
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [lineWidth, setLineWidth] = useState(100);

  useEffect(() => {
    // When trigger changes, we bump the key to remount the SVG and re-trigger CSS animation
    setKey(k => k + 1);
  }, [trigger]);

  useEffect(() => {
    if (containerRef.current) {
        setLineWidth(containerRef.current.offsetWidth);
    }
  }, [trigger, children]);

  return (
    <span ref={containerRef} className="relative inline-block whitespace-nowrap">
      <span className="relative z-10 text-[var(--color-brand-accent)] uppercase">{children}</span>
      <span key={key} className="absolute left-0 bottom-[-4px] z-0 pointer-events-none w-full h-2">
        <svg
          className="w-full h-full"
          width={Math.max(lineWidth || 10, 1)}
          height="8"
          viewBox={`0 0 ${Math.max(lineWidth || 10, 1)} 8`}
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="4"
            x2={Math.max(lineWidth || 10, 1)}
            y2="4"
            stroke="var(--color-brand-accent)"
            strokeWidth="6"
            strokeLinecap="square"
            style={{
              strokeDasharray: lineWidth || 100,
              strokeDashoffset: lineWidth || 100,
              animation: 'drawLine 400ms ease-out forwards',
              animationDelay: '100ms'
            }}
          />
        </svg>
      </span>
    </span>
  );
}
