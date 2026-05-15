import { useLayoutEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

export default function SafeResponsiveContainer({
  children,
  debounce = 50,
  minWidth = 0,
  minHeight = 0,
  ...props
}) {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateReadiness = () => {
      const rect = element.getBoundingClientRect();
      setIsReady(rect.width > 0 && rect.height > 0);
    };

    updateReadiness();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateReadiness);
      return () => window.removeEventListener('resize', updateReadiness);
    }

    const observer = new ResizeObserver(updateReadiness);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full min-w-0 min-h-0">
      {isReady ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={minWidth}
          minHeight={minHeight}
          debounce={debounce}
          {...props}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
