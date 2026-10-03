import anime from 'animejs';

export function animateHeadlineIn(el: HTMLElement) {
  anime({
    targets: el,
    translateY: [-20, 0],
    opacity: [0, 1],
    rotate: [-2, 0],
    duration: 600,
    easing: 'spring(1, 90, 14, 0)'
  });
}
