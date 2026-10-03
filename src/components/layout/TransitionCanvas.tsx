import React, { useEffect, useRef, useState } from 'react';
import { clock, init, effect, frameLoop, surface } from 'vgpu';
import wipeShader from '../../shaders/pageWipe.wgsl';

export function TransitionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(true); // true on mount (reveal page)
  const progressRef = useRef(1.5); // start fully covering, wipe to reveal
  const targetHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    let cleanup = () => {};
    let isDisposed = false;
    let localProgress = 1.5;
    let target = -0.5; // Wipe to reveal

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
        
        const wipeEffect = effect(gpu, wipeShader, { 
          set: { params: { progress: localProgress, resolution: canvasSurface.size } } 
        });

        canvasSurface.onResize(() => {
          wipeEffect.set({ params: { resolution: canvasSurface.size } });
        });

        const time = clock(gpu);
        
        frameLoop(gpu, (frame) => {
          // Animate localProgress towards target
          localProgress += (target - localProgress) * 0.2;
          progressRef.current = localProgress;

          // If we reached the out state, navigate
          if (target > 1.0 && localProgress > 1.4 && targetHrefRef.current) {
             window.location.href = targetHrefRef.current;
             targetHrefRef.current = null;
          }

          wipeEffect.set({ params: { progress: localProgress }});
          frame.pass(canvasSurface, wipeEffect);
        });

        cleanup = () => {
          isDisposed = true;
          gpu.dispose();
        };

        // Intercept link clicks
        const handleClick = (e: MouseEvent) => {
          // If default already prevented or middle click or modifier keys pressed, let browser handle normally
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
          }

          const a = (e.target as Element).closest('a');
          if (!a || !a.href) return;

          // Don't intercept target="_blank" or download links
          if (a.target && a.target !== '_self') return;
          if (a.hasAttribute('download')) return;

          // Don't intercept hash anchor links (e.g. href="#main-content" or same-page hashes)
          const url = new URL(a.href, window.location.href);
          if (url.origin !== window.location.origin) return;
          if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
            return;
          }

          e.preventDefault();
          targetHrefRef.current = a.href;
          setIsActive(true);
          target = 1.5; // Wipe to cover

          // Safety fallback: if WebGPU frameLoop is throttled or paused, guarantee navigation happens
          setTimeout(() => {
            if (targetHrefRef.current) {
              window.location.href = targetHrefRef.current;
              targetHrefRef.current = null;
            }
          }, 450);
        };

        document.addEventListener('click', handleClick);
        cleanup = () => {
          isDisposed = true;
          gpu.dispose();
          document.removeEventListener('click', handleClick);
        };

      } catch (e) {
        console.warn("WebGPU not supported for transitions", e);
      }
    }

    initGpu();

    // After 1 second, make canvas pointer-events-none if we revealed
    const t = setTimeout(() => setIsActive(false), 1000);

    return () => {
      isDisposed = true;
      cleanup();
      clearTimeout(t);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 w-full h-full z-[9999] ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
    />
  );
}
