// Strips and boards in any post: tap a frame to see it big. Registered once, by the first
// strip or board that mounts.
let registered = false;

export function registerLightbox() {
  if (registered) return;
  registered = true;
  document.addEventListener('click', (e) => {
    const img = (e.target as HTMLElement).closest('.strip img, .board img') as HTMLImageElement | null;
    if (!img) return;
    const box = document.createElement('div');
    box.className = 'lightbox';
    const big = document.createElement('img');
    big.src = img.src;
    big.alt = img.alt;
    box.append(big);
    box.onclick = () => box.remove();
    document.body.append(box);
  });
}
