import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface DrawingCanvasHandle {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
  hasInk: () => boolean;
}

interface DrawingCanvasProps {
  className?: string;
  disabled?: boolean;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ className, disabled = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const getPoint = useCallback((event: PointerEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    }, []);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const hasInk = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 240) return true;
      }
      return false;
    }, []);

    useImperativeHandle(ref, () => ({
      clear,
      getCanvas: () => canvasRef.current,
      hasInk,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#2C2A26';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      };

      resize();
      window.addEventListener('resize', resize);

      const onPointerDown = (event: PointerEvent) => {
        if (disabled) return;
        event.preventDefault();
        isDrawingRef.current = true;
        canvas.setPointerCapture(event.pointerId);
        lastPointRef.current = getPoint(event, canvas);
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!isDrawingRef.current || disabled) return;
        const point = getPoint(event, canvas);
        const last = lastPointRef.current;
        if (!last) return;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPointRef.current = point;
      };

      const endStroke = (event: PointerEvent) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        lastPointRef.current = null;
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', endStroke);
      canvas.addEventListener('pointercancel', endStroke);
      canvas.addEventListener('pointerleave', endStroke);

      return () => {
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', endStroke);
        canvas.removeEventListener('pointercancel', endStroke);
        canvas.removeEventListener('pointerleave', endStroke);
      };
    }, [disabled, getPoint]);

    return (
      <div
        className={cn(
          'sketch-card relative overflow-hidden bg-white',
          disabled && 'opacity-60',
          className,
        )}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none cursor-crosshair"
          aria-label="Drawing canvas for Hebrew letter practice"
        />
        <p className="pointer-events-none absolute bottom-2 left-3 font-body text-[11px] text-ink/30">
          Draw with mouse or finger
        </p>
      </div>
    );
  },
);
