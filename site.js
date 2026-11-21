"use strict";

const gallery = document.querySelector(".gallery");
const track = gallery.querySelector(".slides");
const slides = Array.from(track.children);
const thumbs = gallery.querySelector(".thumbs");
const position = document.getElementById("photo-position");
const caption = document.getElementById("photo-caption");
const previous = gallery.querySelector(".previous");
const next = gallery.querySelector(".next");
let photoIndex = 0;

const thumbnailButtons = slides.map((slide, index) => {
  const original = slide.querySelector("img");
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-controls", track.id);
  button.setAttribute("aria-label", "Photo " + (index + 1) + ". " + original.alt);
  const image = new Image();
  image.alt = "";
  image.loading = "lazy";
  image.src = original.getAttribute("src");
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

function showPhoto(index, direction) {
  const target = (index + slides.length) % slides.length;
  if (target === photoIndex) return;
  slides[photoIndex].hidden = true;
  slides[photoIndex].classList.remove("enter-next", "enter-prev");
  thumbnailButtons[photoIndex].removeAttribute("aria-current");
  thumbnailButtons[photoIndex].tabIndex = -1;
  photoIndex = target;
  const slide = slides[target];
  slide.querySelector("img").loading = "eager";
  slide.hidden = false;
  slide.classList.add(direction < 0 ? "enter-prev" : "enter-next");
  position.textContent = String(target + 1);
  caption.textContent = slide.firstElementChild.alt;
  const button = thumbnailButtons[target];
  button.tabIndex = 0;
  button.setAttribute("aria-current", "true");
  const delta = button.getBoundingClientRect().left - thumbs.getBoundingClientRect().left;
  if (delta < 0 || delta + button.offsetWidth > thumbs.clientWidth) {
    thumbs.scrollLeft += delta - (thumbs.clientWidth - button.offsetWidth) / 2;
  }
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
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
home.classList.add("story-enabled");
let activeFrame = -1;
let queued = false;
function updateScroll() {
  queued = false;
  const top = header.getBoundingClientRect().bottom;
  const distance = Math.max(120, home.offsetHeight * .48);
  const progress = Math.max(0, Math.min(1, (top - home.getBoundingClientRect().top) / distance));
  const phase = Math.min(frames.length - 1, progress * (frames.length - .74));
  const selected = Math.round(phase);
  frames.forEach((frame, index) => {
    const opacity = reducedMotion.matches ? Number(index === selected) : Math.max(0, 1 - Math.abs(index - phase));
    frame.style.opacity = String(opacity);
  });
  if (selected !== activeFrame) {
    activeFrame = selected;
    storyCaption.textContent = frames[selected].dataset.caption;
    frames.forEach((frame, index) => frame.setAttribute("aria-hidden", String(index !== selected)));
    markers.forEach((marker, index) => marker.classList.toggle("active", index === selected));
  }
  let current = 0;
  destinations.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= top + 28) current = index;
  });
  if (Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1) {
    current = destinations.length - 1;
  }
  navLinks.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
function scheduleScroll() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(updateScroll);
  }
}
window.addEventListener("scroll", scheduleScroll, {passive:true});
window.addEventListener("resize", scheduleScroll);
window.addEventListener("pageshow", scheduleScroll);
reducedMotion.addEventListener("change", scheduleScroll);
updateScroll();

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
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("arrived");
      reveal.unobserve(entry.target);
    }
  });
  document.querySelectorAll(".gallery-copy,.photo-stage,.section-heading,.season-notes,.footer-row")
    .forEach(element => reveal.observe(element));
}
