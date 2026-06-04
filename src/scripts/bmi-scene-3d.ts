export function initBmiScene3d() {
  const stage = document.getElementById('bmi-scene-3d');
  const track = document.getElementById('bmi-scene-track');
  if (!stage || !track) return;

  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let rotateY = 0;

  function updateTilt() {
    const cards = track.querySelectorAll<HTMLElement>('[data-scene-card]');
    const rect = track.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    cards.forEach((card) => {
      const cr = card.getBoundingClientRect();
      const cardCenter = cr.left + cr.width / 2;
      const offset = (cardCenter - center) / (rect.width / 2);
      const tilt = Math.max(-28, Math.min(28, offset * -22));
      const scale = card.classList.contains('is-active') ? 1.08 : 0.92;
      card.style.transform = `rotateY(${tilt}deg) scale(${scale}) translateZ(${card.classList.contains('is-active') ? 40 : 0}px)`;
    });
  }

  track.addEventListener('scroll', updateTilt, { passive: true });

  track.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.2;
    updateTilt();
  });

  track.addEventListener('pointerup', () => {
    isDragging = false;
  });

  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY;
    updateTilt();
  }, { passive: false });

  document.addEventListener('rbmi:result', ((e: CustomEvent<{ bmi: number; category: { id: string } }>) => {
    const card = track.querySelector<HTMLElement>(`[data-scene-card="${e.detail.category.id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setTimeout(updateTilt, 400);
    }
  }) as EventListener);

  document.querySelectorAll<HTMLElement>('[data-gallery-card]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.galleryCard;
      const sceneCard = track.querySelector<HTMLElement>(`[data-scene-card="${id}"]`);
      sceneCard?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      setTimeout(updateTilt, 400);
    });
  });

  updateTilt();
}