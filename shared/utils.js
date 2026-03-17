window.DrumkitUtils = {
  escapeHtml(text) {
    if (text == null) return "";
    if (typeof text !== "string") text = String(text);
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },
  async generateSignature(timestamp) {
    const secret = "d7b8k9s2-p0q1-r3s4-t5u6-v7w8x9y0z1a2";
    const encoder = new TextEncoder();
    const data = encoder.encode(timestamp + secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },
};
