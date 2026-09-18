document.addEventListener("DOMContentLoaded", () => {
  // Render LaTeX Title in Old-Style Serif
  if (window.katex) {
    katex.render("\\mathcal{T}\\text{ravel } \\mathcal{P}\\text{lanner}", document.getElementById("latex-title"), {
      throwOnError: false
    });
  }

  const form = document.getElementById("planner-form");
  const list = document.getElementById("itinerary-list");
  const photoInput = document.getElementById("photo-input");

  let resizedImageData = "";

  // Rescale and resize image using Canvas
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 120; // Small preview thumbnail size
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resizedImageData = canvas.toDataURL("image/jpeg", 0.7); // Rescaled JPEG
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Handle Form Submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const destination = document.getElementById("destination").value;
    const activity = document.getElementById("activity").value;
    const mapLink = document.getElementById("map-link").value;

    addItineraryItem({ date, time, destination, activity, mapLink, photo: resizedImageData });

    form.reset();
    resizedImageData = "";
  });

  function addItineraryItem(data) {
    const li = document.createElement("li");
    li.className = "drag-item";
    li.draggable = true;

    li.innerHTML = `
      <span class="drag-handle">☰</span>
      ${data.photo ? `<img src="${data.photo}" class="item-thumb" alt="Review photo" />` : ""}
      <div class="item-content">
        <div class="item-meta">📅 ${data.date} at ${data.time}</div>
        <div class="item-title">${escapeHtml(data.destination)}</div>
        <div>${escapeHtml(data.activity)}</div>
        ${data.mapLink ? `<a href="${escapeHtml(data.mapLink)}" target="_blank" class="item-map-link">📍 View on Google Maps</a>` : ""}
      </div>
      <button class="delete-btn" title="Delete">✕</button>
    `;

    // Delete item listener
    li.querySelector(".delete-btn").addEventListener("click", () => li.remove());

    // Drag and drop event listeners
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    list.appendChild(li);
  }

  // Drag over container handler
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const draggingItem = document.querySelector(".dragging");
    if (!draggingItem) return;

    const siblings = [...list.querySelectorAll(".drag-item:not(.dragging)")];
    const nextSibling = siblings.find((sibling) => {
      return e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2;
    });

    list.insertBefore(draggingItem, nextSibling);
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }
});
