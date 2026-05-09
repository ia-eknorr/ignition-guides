if (typeof window !== "undefined") {
  // Inject keyboard shortcut badge into search button
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const observer = new MutationObserver(() => {
    const btn = document.querySelector(".aa-DetachedSearchButton");
    if (btn && !btn.querySelector(".search-shortcut-badge")) {
      const badge = document.createElement("kbd");
      badge.className = "search-shortcut-badge";
      badge.textContent = isMac ? "⌘K" : "Ctrl+K";
      btn.appendChild(badge);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Keyboard shortcuts: Cmd+K / Ctrl+K and "/"
  document.addEventListener("keydown", (e) => {
    const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
    const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;

    if (!isCmdK && !isSlash) return;

    const tag = document.activeElement?.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      document.activeElement?.isContentEditable
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => {
      const btn = document.querySelector(".dsla-search-wrapper button");
      if (btn) btn.click();
    }, 0);
  });
}
