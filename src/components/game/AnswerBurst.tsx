import React, { useEffect, useRef } from 'react';
import { clock, init, draw, frameLoop, surface, target } from 'vgpu';
import particleShader from '../../shaders/particles.wgsl';

interface AnswerBurstProps {
  isCorrect: boolean;
}

export function AnswerBurst({ isCorrect }: AnswerBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    let cleanup = () => {};
    let isDisposed = false;
    let loop: any;

    async function initGpu() {
      try {
        const gpu = await init();
        if (isDisposed || !canvasRef.current) {
          gpu.dispose();
          return;
        }

        const canvas = canvasRef.current;
        const canvasSurface = surface(gpu, canvas, { 
          dpr: window.devicePixelRatio || 1,
          alphaMode: 'premultiplied' 
        });
        
        const numParticles = 500;
        const vertexCount = numParticles * 6; // 6 vertices per quad
        
        const burstDraw = draw(gpu, {
          shader: particleShader,
          label: 'particles',
          vertices: vertexCount,
          set: { 
            params: { 
              time: 0, 
              resolution: canvasSurface.size,
              // The origin is the center of the screen
              origin: [window.innerWidth / 2, window.innerHeight / 2],
              isCorrect: isCorrect ? 1.0 : 0.0
            } 
          }
        });

        canvasSurface.onResize(() => {
          burstDraw.set({ params: { resolution: canvasSurface.size, origin: [window.innerWidth / 2, window.innerHeight / 2] } });
        });

        const time = clock(gpu);
        
        loop = frameLoop(gpu, (frame) => {
          // Time starts from 0 when the component mounts
          burstDraw.set({ params: { time: time.time } });
          
          // Use a transparent target by overriding the default opaque clear color
          const out = canvasSurface; 
          
          // In vgpu, frame.pass clear color is opaque black by default
          frame.pass({ target: out, clear: [0, 0, 0, 0] }, burstDraw);
          
          // Stop drawing after 1.5 seconds to save resources
          if (time.time > 1.5) {
             loop?.stop();
          }
        });

        cleanup = () => {
          isDisposed = true;
          loop?.stop();
          gpu.dispose();
        };
      } catch (e) {
        console.warn("WebGPU not supported for particles", e);
      }
    }

    initGpu();

    return () => {
      isDisposed = true;
      cleanup();
    };
  }, [isCorrect]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-[100]"
    />
  );
}
