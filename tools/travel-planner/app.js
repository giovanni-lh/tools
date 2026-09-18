document.addEventListener("DOMContentLoaded", () => {
  if (window.katex) {
    katex.render("\\mathcal{T}\\text{ravel } \\mathcal{P}\\text{lanner}", document.getElementById("latex-title"), {
      throwOnError: false
    });
  }

  const form = document.getElementById("planner-form");
  const list = document.getElementById("itinerary-list");
  const photoInput = document.getElementById("photo-input");
  
  const generateUrlBtn = document.getElementById("generate-url-btn");
  const urlOutputContainer = document.getElementById("url-output-container");
  const generatedUrlInput = document.getElementById("generated-url");
  const copyUrlBtn = document.getElementById("copy-url-btn");

  let resizedImageData = "";

  // Load initial state strictly from URL Hash on page visit
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
        const maxDim = 100; // Keep image small to restrict total URL length
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
        resizedImageData = canvas.toDataURL("image/jpeg", 0.5);
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
    });

    // Drag and drop event listeners
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

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

  // --- GENERATE HASH URL & COPY LOGIC ---

  generateUrlBtn.addEventListener("click", () => {
    const items = [...list.querySelectorAll(".drag-item")].map((li) => JSON.parse(li.dataset.itemJson));

    if (items.length === 0) {
      alert("Please add at least one item to your itinerary before generating a URL.");
      return;
    }

    // Compress JSON string using LZ-String
    const jsonString = JSON.stringify(items);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);

    // Update browser URL hash without refreshing
    const newUrl = `${window.location.origin}${window.location.pathname}#${compressed}`;
    window.history.replaceState(null, "", `#${compressed}`);

    // Show output field
    generatedUrlInput.value = newUrl;
    urlOutputContainer.style.display = "block";
  });

  copyUrlBtn.addEventListener("click", async () => {
    if (!generatedUrlInput.value) return;

    try {
      await navigator.clipboard.writeText(generatedUrlInput.value);
      const originalText = copyUrlBtn.textContent;
      copyUrlBtn.textContent = "Copied!";
      copyUrlBtn.style.backgroundColor = "#2aa198";

      setTimeout(() => {
        copyUrlBtn.textContent = originalText;
        copyUrlBtn.style.backgroundColor = "#268bd2";
      }, 2000);
    } catch (err) {
      alert("Failed to copy. Please select and copy the text box manually.");
    }
  });

  function loadStateFromHash() {
    if (!window.location.hash || window.location.hash.length <= 1) return;

    try {
      const compressed = window.location.hash.substring(1);
      const decompressed = LZString.decompressFromEncodedURIComponent(compressed);

      if (decompressed) {
        const items = JSON.parse(decompressed);
        items.forEach((item) => addItineraryItemToDOM(item));
        
        // Show current URL in input
        generatedUrlInput.value = window.location.href;
        urlOutputContainer.style.display = "block";
      }
    } catch (err) {
      console.error("Failed to parse URL hash data:", err);
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }
});
