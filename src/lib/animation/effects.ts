import anime from 'animejs';

export function burstConfetti(originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const colors = ['#000', '#32cd32', '#f4f4f0', '#000'];

  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed; width: 12px; height: 12px;
      border: 2px solid #000;
      background: ${colors[i % colors.length]};
      left: ${originX}px; top: ${originY}px;
      pointer-events: none; z-index: 9999;
    `;
    // 50% chance of being circular
    if (Math.random() > 0.5) particle.style.borderRadius = '50%';
    
    document.body.appendChild(particle);

    anime({
      targets: particle,
      translateX: anime.random(-300, 300),
      translateY: anime.random(-400, 200),
      rotate: anime.random(-720, 720),
      scale: [1, 0],
      opacity: {
        value: [1, 0],
        duration: anime.random(800, 1400),
        easing: 'linear',
      },
      duration: anime.random(800, 1400),
      easing: 'easeOutExpo',
      complete: () => particle.remove()
    });
  }
}

export function screenshake(el: HTMLElement) {
  anime({
    targets: el,
    translateX: [0, -12, 10, -8, 6, -4, 2, 0],
    duration: 420,
    easing: 'easeInOutSine'
  });
}
