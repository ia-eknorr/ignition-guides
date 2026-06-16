import React from "react";
import styles from "./styles.module.css";

// Human-readable labels for each deployment context an `applies_to` page can declare.
const PLATFORM_LABELS: Record<string, string> = {
  docker: "Docker",
  kubernetes: "Kubernetes",
  "bare-metal": "Bare-metal",
};

interface AppliesToProps {
  // Comes straight from page front matter, so it may be missing or malformed.
  platforms?: unknown;
}

// Renders the deployment-context badges declared by a page's `applies_to` front
// matter. Returns null when the field is absent or not a non-empty array, so the
// component is safe to inject on every doc page (most pages won't declare it).
export default function AppliesTo({ platforms }: AppliesToProps): JSX.Element | null {
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return null;
  }

  return (
    <div className={styles.appliesTo} role="note" aria-label="Applies to deployment contexts">
      <span className={styles.label}>Applies to</span>
      <span className={styles.badges}>
        {platforms.map((platform) => {
          const key = String(platform);
          return (
            <span key={key} className={styles.badge} data-platform={key}>
              {PLATFORM_LABELS[key] ?? key}
            </span>
          );
        })}
      </span>
    </div>
  );
}
