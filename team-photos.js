"use strict";
for (const track of document.querySelectorAll(".album-track")) {
  const controls = track.closest(".album").querySelector(".album-buttons");
  const [previous,next] = controls.querySelectorAll("button");
  function update() {
    controls.hidden = track.scrollWidth <= track.clientWidth + 2;
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  controls.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    const cards = track.children;
    track.scrollBy({left: Number(button.dataset.step) * (cards[1].offsetLeft - cards[0].offsetLeft), behavior:"smooth"});
  });
  track.addEventListener("scroll", update, {passive:true});
  new ResizeObserver(update).observe(track);
  update();
}
const photos = Array.from(document.querySelectorAll(".photo-track a"));
const viewer = document.querySelector("#photo-viewer");
const enlarged = viewer.querySelector("#enlarged-photo");
let currentPhoto = 0;
function showPhoto(index) {
  currentPhoto = (index + photos.length) % photos.length;
  const link = photos[currentPhoto];
  enlarged.src = link.href;
  enlarged.alt = link.querySelector("img").alt;
  viewer.querySelector("#photo-count").textContent = (currentPhoto + 1) + " / " + photos.length;
}
photos.forEach((link,index) => link.addEventListener("click",event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  showPhoto(index);
  viewer.showModal();
}));
viewer.querySelector("[data-close]").addEventListener("click",() => viewer.close());
viewer.querySelectorAll("[data-viewer-step]").forEach(button => button.addEventListener("click",() => showPhoto(currentPhoto + Number(button.dataset.viewerStep))));
viewer.addEventListener("keydown",event => {
  if (event.key === "ArrowRight") showPhoto(currentPhoto + 1);
  if (event.key === "ArrowLeft") showPhoto(currentPhoto - 1);
});
