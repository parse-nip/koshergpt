import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

export interface DrawingCanvasHandle {
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
  getStrokes: () => Point[][];
  hasInk: () => boolean;
}

interface DrawingCanvasProps {
  className?: string;
  disabled?: boolean;
}

function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ className, disabled = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<Point[][]>([]);
    const currentStrokeRef = useRef<Point[]>([]);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<Point | null>(null);
    const logicalSizeRef = useRef({ width: 0, height: 0 });

    const getPoint = useCallback((event: PointerEvent, canvas: HTMLCanvasElement): Point => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }, []);

    const paintBackground = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }, []);

    const applyBrush = useCallback((ctx: CanvasRenderingContext2D) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = isCoarsePointer() ? 7 : 5;
      ctx.strokeStyle = '#2C2A26';
    }, []);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      strokesRef.current = [];
      currentStrokeRef.current = [];
      paintBackground(canvas, ctx);
    }, [paintBackground]);

    const hasInk = useCallback(() => strokesRef.current.length > 0, []);

    useImperativeHandle(ref, () => ({
      clear,
      getCanvas: () => canvasRef.current,
      getStrokes: () => strokesRef.current.map((stroke) => stroke.map((point) => ({ ...point }))),
      hasInk,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const hadInk = strokesRef.current.length > 0;
        let snapshot: ImageData | null = null;

        if (hadInk && logicalSizeRef.current.width > 0) {
          snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        logicalSizeRef.current = { width: rect.width, height: rect.height };

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        applyBrush(ctx);
        paintBackground(canvas, ctx);

        if (snapshot && logicalSizeRef.current.width > 0) {
          const restore = document.createElement('canvas');
          restore.width = snapshot.width;
          restore.height = snapshot.height;
          restore.getContext('2d')?.putImageData(snapshot, 0, 0);
          ctx.drawImage(restore, 0, 0, rect.width, rect.height);
        }
      };

      resize();
      const observer = new ResizeObserver(() => resize());
      observer.observe(canvas);

      const onPointerDown = (event: PointerEvent) => {
        if (disabled) return;
        event.preventDefault();
        isDrawingRef.current = true;
        canvas.setPointerCapture(event.pointerId);
        const point = getPoint(event, canvas);
        lastPointRef.current = point;
        currentStrokeRef.current = [point];

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x + 0.01, point.y + 0.01);
        ctx.stroke();
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!isDrawingRef.current || disabled) return;
        event.preventDefault();
        const point = getPoint(event, canvas);
        const last = lastPointRef.current;
        if (!last) return;

        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (dx * dx + dy * dy < 1.5) return;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        currentStrokeRef.current.push(point);
        lastPointRef.current = point;
      };

      const endStroke = (event: PointerEvent) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        lastPointRef.current = null;

        if (currentStrokeRef.current.length > 0) {
          strokesRef.current.push(currentStrokeRef.current);
          currentStrokeRef.current = [];
        }

        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', endStroke);
      canvas.addEventListener('pointercancel', endStroke);

      return () => {
        observer.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', endStroke);
        canvas.removeEventListener('pointercancel', endStroke);
      };
    }, [applyBrush, disabled, getPoint, paintBackground]);

    return (
      <div
        className={cn(
          'sketch-card relative overflow-hidden bg-white select-none',
          disabled && 'opacity-60',
          className,
        )}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          aria-label="Drawing canvas for Hebrew letter practice"
        />
        <p className="pointer-events-none absolute bottom-2 left-3 font-body text-[11px] text-ink/30">
          Draw with mouse or finger
        </p>
      </div>
    );
  },
);
