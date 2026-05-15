import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, useState } from 'react';

export default function SafeResponsiveContainer({
  children,
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = {
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      };

      setSize((currentSize) => {
        if (currentSize.width === nextSize.width && currentSize.height === nextSize.height) {
          return currentSize;
        }

        return nextSize;
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const canRenderChart = size.width > 0 && size.height > 0;
  const sizedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child, {
      width: size.width,
      height: size.height,
    });
  });

  return (
    <div ref={containerRef} className="h-full w-full min-w-0 min-h-0">
      {canRenderChart ? sizedChildren : null}
    </div>
  );
}
