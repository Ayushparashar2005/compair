import anime from 'animejs';

export function animateCardFlip(cardEl: HTMLElement, isWinner: boolean) {
  const tl = anime.timeline({
    easing: 'spring(1, 80, 12, 0)'
  });

  tl
    .add({
      targets: cardEl,
      rotateY: [0, 90],
      duration: 280,
      easing: 'easeInCubic'
    })
    .add({
      targets: cardEl,
      rotateY: [90, 0],
      duration: 280,
      easing: 'easeOutCubic'
    })
    .add({
      targets: cardEl,
      scale: isWinner ? [1, 1.04, 1] : [1, 0.96],
      boxShadow: isWinner 
        ? ['6px 6px 0px #000', '10px 10px 0px #32cd32', '6px 6px 0px #000'] 
        : ['6px 6px 0px #000', '0px 0px 0px #000'],
      opacity: isWinner ? [1, 1] : [1, 0.5],
      duration: 400
    }, '-=200');

  return tl;
}
