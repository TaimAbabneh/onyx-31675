"use strict";

document.documentElement.classList.add("js");

const menu = document.querySelector(".menu-button");
const navigation = document.querySelector("#navigation");

function setMenu(open) {
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("is-open", open);
}

menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") === "false"));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menu.focus();
  }
});
window.matchMedia("(min-width: 721px)").addEventListener("change", () => setMenu(false));

const mechanism = document.querySelector(".mechanism");
if (mechanism) {
  const panels = [...document.querySelectorAll("details[data-part]")];
  panels.forEach(panel => {
    panel.querySelector("summary").addEventListener("click", event => {
      event.preventDefault();
      const open = !panel.open;
      panels.forEach(other => { other.open = open && other === panel; });
      mechanism.dataset.selected = open ? panel.dataset.part : "";
    });
  });
}

const copyButton = document.querySelector(".copy-email");
if (copyButton && navigator.clipboard && navigator.clipboard.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    const status = document.querySelector(".copy-status");
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email);
      status.textContent = "Email address copied.";
    } catch {
      status.textContent = "Select the email address above and copy it.";
    }
  });
}

