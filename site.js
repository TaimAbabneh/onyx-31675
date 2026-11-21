"use strict";

const gallery = document.querySelector(".gallery");
const track = gallery.querySelector(".slides");
const slides = Array.from(track.children);
const thumbs = gallery.querySelector(".thumbs");
const position = document.getElementById("photo-position");
const caption = document.getElementById("photo-caption");
const previous = gallery.querySelector(".previous");
const next = gallery.querySelector(".next");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const photoError = document.getElementById("photo-error");
let photoIndex = 0;
let displayedIndex = 0;
let readyTurn = null;
let turning = null;
const pendingImages = new WeakMap();

// Decode before a frame becomes visible, including after a fast sequence of taps.
function readyImage(image) {
  if (!pendingImages.has(image)) {
    image.loading = "eager";
    const promise = image.decode().catch(error => {
      pendingImages.delete(image);
      throw error;
    });
    pendingImages.set(image, promise);
  }
  return pendingImages.get(image);
}
function warmNeighbors() {
  if (navigator.connection?.saveData) return;
  for (const step of [-1, 1]) {
    const neighbor = slides[(displayedIndex + step + slides.length) % slides.length];
    readyImage(neighbor.firstElementChild).catch(() => {});
  }
}

const thumbnailButtons = slides.map((slide, index) => {
  const original = slide.querySelector("img");
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-controls", track.id);
  button.setAttribute("aria-label", "Photo " + (index + 1) + ". " + original.alt);
  const image = new Image();
  image.alt = "";
  image.loading = "lazy";
  image.width = 112;
  image.height = 84;
  image.decoding = "async";
  image.src = "thumbs/" + original.getAttribute("src").replace(".jpg", ".webp");
  button.append(image);
  thumbs.append(button);
  slide.hidden = index !== 0;
  button.tabIndex = index === 0 ? 0 : -1;
  button.addEventListener("click", () => showPhoto(index, index - photoIndex));
  return button;
});
thumbnailButtons[0].setAttribute("aria-current", "true");
gallery.classList.add("ready");
thumbs.hidden = previous.hidden = next.hidden = false;

function selectThumb(index) {
  thumbnailButtons[photoIndex].removeAttribute("aria-current");
  thumbnailButtons[photoIndex].tabIndex = -1;
  photoIndex = index;
  const button = thumbnailButtons[index];
  button.tabIndex = 0;
  button.setAttribute("aria-current", "true");
  const delta = button.getBoundingClientRect().left - thumbs.getBoundingClientRect().left;
  if (delta < 0 || delta + button.offsetWidth > thumbs.clientWidth) {
    thumbs.scrollBy({left:delta - (thumbs.clientWidth - button.offsetWidth) / 2,
      behavior:reducedMotion.matches ? "instant" : "smooth"});
  }
}

async function showPhoto(index, direction) {
  const target = (index + slides.length) % slides.length;
  selectThumb(target);
  readyTurn = null;
  photoError.hidden = true;
  if (target === displayedIndex) return;
  try {
    await readyImage(slides[target].firstElementChild);
  } catch {
    if (target === photoIndex) {
      selectThumb(displayedIndex);
      photoError.textContent = "This photo could not load. Select it again to retry.";
      photoError.hidden = false;
    }
    return;
  }
  if (target !== photoIndex) return;
  readyTurn = {target, direction};
  presentPhoto();
}
async function presentPhoto() {
  if (turning || !readyTurn) return;
  const {target, direction} = readyTurn;
  readyTurn = null;
  if (target === displayedIndex || target !== photoIndex) return;
  const outgoing = slides[displayedIndex];
  const incoming = slides[target];
  outgoing.setAttribute("aria-hidden", "true");
  incoming.removeAttribute("aria-hidden");
  incoming.hidden = false;
  incoming.classList.add("turning-in");
  displayedIndex = target;
  position.textContent = String(target + 1);
  caption.textContent = incoming.firstElementChild.alt;
  if (!reducedMotion.matches && incoming.animate) {
    const sign = direction < 0 ? -1 : 1;
    turning = incoming.animate([
      {opacity:0, transform:"translateX(" + sign * 9 + "px) rotate(" + sign * .5 + "deg)"},
      {opacity:1, transform:"none"}
    ], {duration:240, easing:"cubic-bezier(.22,.7,.25,1)"});
    await turning.finished.catch(() => {});
    turning = null;
  }
  outgoing.hidden = true;
  incoming.classList.remove("turning-in");
  warmNeighbors();
  presentPhoto();
}
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) turning?.finish();
});
if ("IntersectionObserver" in window) {
  const nearby = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      warmNeighbors();
      nearby.disconnect();
    }
  }, {rootMargin:"250px"});
  nearby.observe(gallery);
} else {
  warmNeighbors();
}
previous.addEventListener("click", () => showPhoto(photoIndex - 1, -1));
next.addEventListener("click", () => showPhoto(photoIndex + 1, 1));
gallery.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  let target;
  switch (event.key) {
    case "ArrowRight": target = photoIndex + 1; break;
    case "ArrowLeft": target = photoIndex - 1; break;
    case "Home": target = 0; break;
    case "End": target = slides.length - 1; break;
    default: return;
  }
  event.preventDefault();
  showPhoto(target, target - photoIndex);
  if (thumbs.contains(event.target)) thumbnailButtons[photoIndex].focus({preventScroll:true});
});
let touchStart;
track.addEventListener("touchstart", (event) => {
  touchStart = event.touches.length === 1 ? event.touches[0] : null;
}, {passive:true});
track.addEventListener("touchcancel", () => { touchStart = null; });
track.addEventListener("touchend", (event) => {
  if (!touchStart || event.touches.length) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.clientX;
  const dy = touch.clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    const direction = dx < 0 ? 1 : -1;
    showPhoto(photoIndex + direction, direction);
  }
}, {passive:true});

const home = document.getElementById("home");
const frames = Array.from(home.querySelectorAll(".story-frames img"));
const markers = Array.from(home.querySelectorAll(".story-progress i"));
const storyCaption = document.getElementById("story-caption");
const header = document.querySelector(".masthead");
const navLinks = Array.from(header.querySelectorAll("nav a"));
const destinations = navLinks.map(link => document.getElementById(link.hash.slice(1)));
home.classList.add("story-enabled");
let wantedFrame = 0;
let shownFrame = 0;
let activeSection = 0;
let sectionOffsets = [];
let storyStart = 0;
let storyLength = 1;
let maxScroll = 0;
let queued = false;

function measurePage() {
  const inset = header.offsetHeight;
  sectionOffsets = destinations.map(section => scrollY + section.getBoundingClientRect().top - inset - 28);
  const homeTop = scrollY + home.getBoundingClientRect().top;
  const mobile = matchMedia("(max-width:580px)").matches;
  const photoStart = mobile ? scrollY + home.querySelector(".story-frames").getBoundingClientRect().top - innerHeight * .65 : 0;
  storyStart = Math.max(homeTop - inset, photoStart);
  storyLength = Math.max(160, home.offsetHeight * .48);
  maxScroll = document.documentElement.scrollHeight - innerHeight;
  scheduleScroll();
}
async function changeFrame(index) {
  wantedFrame = index;
  try { await readyImage(frames[index]); } catch { return; }
  if (wantedFrame !== index || shownFrame === index) return;
  shownFrame = index;
  storyCaption.textContent = frames[index].dataset.caption;
  // Lower layers remain opaque while the incoming image fades over them.
  frames.forEach((frame, i) => {
    frame.classList.toggle("revealed", i <= index);
    frame.setAttribute("aria-hidden", String(i !== index));
    markers[i].classList.toggle("active", i === index);
  });
}
function updateScroll() {
  queued = false;
  const y = Math.max(0, window.scrollY);
  const progress = (y - storyStart) / storyLength;
  // Separate forward and reverse boundaries so tiny scroll reversals do not flicker.
  const first = wantedFrame === 0 ? .27 : .22;
  const second = wantedFrame < 2 ? .73 : .68;
  const selected = progress >= second ? 2 : progress >= first ? 1 : 0;
  if (selected !== wantedFrame) changeFrame(selected);
  let current = 0;
  for (let i = 1; i < sectionOffsets.length; i++) {
    if (y >= sectionOffsets[i]) current = i;
  }
  if (maxScroll > 0 && y >= maxScroll - 1) current = destinations.length - 1;
  if (current !== activeSection) {
    navLinks[activeSection].removeAttribute("aria-current");
    navLinks[current].setAttribute("aria-current", "location");
    activeSection = current;
  }
}
function scheduleScroll() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(updateScroll);
  }
}
window.addEventListener("scroll", scheduleScroll, {passive:true});
window.addEventListener("resize", measurePage);
window.addEventListener("pageshow", measurePage);
if ("ResizeObserver" in window) {
  const layout = new ResizeObserver(measurePage);
  [header,...destinations,document.querySelector("footer")].forEach(element => layout.observe(element));
}
measurePage();

function openLinkedDetails() {
  const target = document.getElementById(location.hash.slice(1));
  if (target instanceof HTMLDetailsElement) target.open = true;
}
openLinkedDetails();
window.addEventListener("hashchange", openLinkedDetails);
const dates = new Intl.DateTimeFormat("en-US", {
  timeZone:"America/Chicago", year:"numeric", month:"2-digit", day:"2-digit"
}).formatToParts(new Date());
const datePart = name => dates.find(part => part.type === name).value;
const today = [datePart("year"),datePart("month"),datePart("day")].join("-");
const upcoming = Array.from(document.querySelectorAll(".events time")).find(time => time.dateTime >= today);
if (upcoming) {
  const label = document.createElement("small");
  label.textContent = upcoming.dateTime === today ? "Today" : "Up next";
  const event = upcoming.closest("li");
  event.classList.add("upcoming");
  event.querySelector(".event-copy").append(label);
}
