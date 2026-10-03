import React, { useEffect, useRef, useState } from 'react';
import { clock, init, effect, frameLoop, surface } from 'vgpu';
import hoverShader from '../../shaders/entityHover.wgsl';

interface VgpuHoverEffectProps {
  isHovered: boolean;
}

export function VgpuHoverEffect({ isHovered }: VgpuHoverEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (typeof window === 'undefined') return;

    let cleanup = () => {};
    let isDisposed = false;

    async function initGpu() {
      try {
        const gpu = await init();
        if (isDisposed || !canvasRef.current) {
          gpu.dispose();
          return;
        }

        const canvas = canvasRef.current;
        const canvasSurface = surface(gpu, canvas, { dpr: window.devicePixelRatio || 1 });
        
        // Use alphaMode 'premultiplied' for transparent background
        const hoverEffect = effect(gpu, hoverShader, { 
          set: { params: { time: 0, resolution: canvasSurface.size, isHovered: 0.0 } } 
        });

        canvasSurface.onResize(() => {
          hoverEffect.set({ params: { resolution: canvasSurface.size } });
        });

        const time = clock(gpu);
        
        frameLoop(gpu, (frame) => {
          // Pass the hovered state down
          // We look at the data attribute to sync state without React re-renders driving the loop
          const hovered = canvas.dataset.hovered === 'true' ? 1.0 : 0.0;
          hoverEffect.set({ params: { 
            time: time.time, 
            isHovered: hovered 
          }});
          frame.pass(canvasSurface, hoverEffect);
        });

        cleanup = () => {
          isDisposed = true;
          gpu.dispose();
        };
      } catch (e) {
        console.warn("WebGPU not supported for hover effect", e);
      }
    }

    initGpu();

    return () => {
      isDisposed = true;
      cleanup();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      data-hovered={isHovered}
      className="absolute inset-0 w-full h-full pointer-events-none z-50 transition-opacity duration-300"
      style={{ opacity: isHovered ? 1 : 0 }}
    />
  );
}
