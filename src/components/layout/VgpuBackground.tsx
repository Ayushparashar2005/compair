import React, { useEffect, useRef } from 'react';
import { clock, init, effect, frameLoop, surface } from 'vgpu';
import bgShader from '../../shaders/background.wgsl';

export default function VgpuBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // We only run this in the browser
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
        
        const bgEffect = effect(gpu, bgShader, { 
          set: { params: { time: 0, resolution: canvasSurface.size } } 
        });

        canvasSurface.onResize(() => {
          bgEffect.set({ params: { resolution: canvasSurface.size } });
        });

        const time = clock(gpu);
        
        frameLoop(gpu, (frame) => {
          bgEffect.set({ params: { time: time.time } });
          frame.pass(canvasSurface, bgEffect);
        });

        cleanup = () => {
          gpu.dispose();
        };
      } catch (e) {
        console.warn("WebGPU not supported or initialization failed", e);
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
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
