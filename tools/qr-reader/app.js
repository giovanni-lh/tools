document.addEventListener("DOMContentLoaded", () => {
  const scannedTextElem = document.getElementById("scanned-text");
  const resultContainer = document.getElementById("result-container");
  const copyBtn = document.getElementById("copy-btn");

  let html5QrcodeScanner;

  function onScanSuccess(decodedText, decodedResult) {
    // Show decoded text
    scannedTextElem.textContent = decodedText;
    resultContainer.style.display = "block";
  }

  function onScanFailure(error) {
    // Continuous scanning outputs errors when no QR is in frame. Ignore them.
  }

  // Initialize Scanner (asks for camera permissions on start)
  html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      facingMode: "environment" // Uses rear camera on phones/tablets by default
    },
    /* verbose= */ false
  );

  html5QrcodeScanner.render(onScanSuccess, onScanFailure);

  // Copy to Clipboard Logic
  copyBtn.addEventListener("click", async () => {
    const textToCopy = scannedTextElem.textContent;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      copyBtn.style.backgroundColor = "#28a745";

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = "#0066cc";
      }, 2000);
    } catch (err) {
      alert("Failed to copy to clipboard. Please copy manually.");
    }
  });
});
