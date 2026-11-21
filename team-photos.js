"use strict";
const deck = document.querySelector(".deck");
const cards = Array.from(deck.querySelectorAll("li"));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let active = 0;
let turning = false;
cards.forEach((card, index) => {
  const caption = document.createElement("p");
  caption.className = "caption";
  caption.append(card.querySelector("img").alt);
  const count = document.createElement("span");
  count.textContent = (index + 1) + " / " + cards.length;
  caption.append(count);
  card.append(caption);
  card.hidden = index !== 0;
});
deck.classList.add("ready");
deck.querySelectorAll("button").forEach(button => { button.hidden = false; });
deck.querySelector("ul").setAttribute("aria-live","polite");
async function turn(direction) {
  if (turning) return;
  turning = true;
  const old = cards[active];
  active = (active + direction + cards.length) % cards.length;
  const incoming = cards[active];
  incoming.hidden = false;
  old.style.zIndex = "1";
  try {
    if (!reducedMotion.matches) {
      await old.animate([
        {transform:"translateX(0) rotate(0)",opacity:1},
        {transform:"translateX(" + (-15 * direction) + "%) rotate(" + (-5 * direction) + "deg) rotateY(" + (18 * direction) + "deg)",opacity:0}
      ], {duration:280,easing:"cubic-bezier(.25,.7,.25,1)",fill:"forwards"}).finished;
    }
  } finally {
    old.hidden = true;
    old.getAnimations().forEach(animation => animation.cancel());
    old.style.zIndex = "";
    turning = false;
  }
}
deck.querySelector(".prev").addEventListener("click",() => turn(-1));
deck.querySelector(".next").addEventListener("click",() => turn(1));
deck.addEventListener("keydown",event => {
  if (!["ArrowLeft","ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  turn(event.key === "ArrowRight" ? 1 : -1);
});
let start;
deck.addEventListener("touchstart",event => {start = event.touches[0];}, {passive:true});
deck.addEventListener("touchend",event => {
  if (!start) return;
  const dx = event.changedTouches[0].clientX - start.clientX;
  const dy = event.changedTouches[0].clientY - start.clientY;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
  start = null;
}, {passive:true});
