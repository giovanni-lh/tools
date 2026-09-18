document.addEventListener("DOMContentLoaded", () => {
  if (window.katex) {
    katex.render("\\mathcal{T}\\text{ravel } \\mathcal{P}\\text{lanner}", document.getElementById("latex-title"), {
      throwOnError: false
    });
  }

  const form = document.getElementById("planner-form");
  const list = document.getElementById("itinerary-list");
  const photoInput = document.getElementById("photo-input");

  let resizedImageData = "";

  // Load initial state strictly from the URL Hash
  loadStateFromHash();

  // Image downscaling
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 100; // Small max dimension to keep URL hash short
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
        resizedImageData = canvas.toDataURL("image/jpeg", 0.5); // Lower quality JPEG for smaller string size
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Handle Form Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const itemData = {
      id: Date.now().toString(),
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      destination: document.getElementById("destination").value,
      activity: document.getElementById("activity").value,
      mapLink: document.getElementById("map-link").value,
      photo: resizedImageData
    };

    addItineraryItemToDOM(itemData);
    updateHashAndQR();

    form.reset();
    resizedImageData = "";
  });

  function addItineraryItemToDOM(data) {
    const li = document.createElement("li");
    li.className = "drag-item";
    li.draggable = true;
    li.dataset.itemJson = JSON.stringify(data);

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
    li.querySelector(".delete-btn").addEventListener("click", () => {
      li.remove();
      updateHashAndQR();
    });

    // Drag and drop event listeners
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      updateHashAndQR();
    });

    list.appendChild(li);
  }

  // Drag over container
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

  // --- URL HASH ENCODING & QR CODE LOGIC ---

  function updateHashAndQR() {
    const items = [...list.querySelectorAll(".drag-item")].map((li) => JSON.parse(li.dataset.itemJson));
    
    if (items.length === 0) {
      window.history.replaceState(null, "", window.location.pathname);
      document.getElementById("qr-container").innerHTML = "<p style='color: #839496;'>Add items to generate share QR</p>";
      return;
    }

    // Compress JSON string using LZ-String
    const jsonString = JSON.stringify(items);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    
    // Update the browser URL without refreshing
    window.history.replaceState(null, "", `#${compressed}`);

    // Render updated QR Code
    const fullUrl = window.location.href;
    const qrContainer = document.getElementById("qr-container");
    qrContainer.innerHTML = '<canvas id="share-qr"></canvas>';
    
    QRCode.toCanvas(document.getElementById("share-qr"), fullUrl, { width: 180 }, (err) => {
      if (err) console.error("QR Code Error:", err);
    });
  }

  function loadStateFromHash() {
    if (!window.location.hash || window.location.hash.length <= 1) return;

    try {
      const compressed = window.location.hash.substring(1);
      const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
      
      if (decompressed) {
        const items = JSON.parse(decompressed);
        items.forEach((item) => addItineraryItemToDOM(item));
        updateHashAndQR();
      }
    } catch (err) {
      console.error("Failed to parse URL hash data:", err);
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }
});
