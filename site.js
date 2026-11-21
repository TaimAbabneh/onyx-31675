"use strict";

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
