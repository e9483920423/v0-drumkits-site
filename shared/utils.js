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
};
