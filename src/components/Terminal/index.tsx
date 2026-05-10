import React from 'react';
import styles from './styles.module.css';

interface TerminalProps {
  title?: string;
  // Preferred: one string per line, works inside list items
  lines?: string[];
  // Alternative: template literal, works at top level only
  children?: string;
}

function renderLine(line: string, i: number) {
  const isCommand = /^\s*[$%#>]/.test(line);
  return (
    <span key={i} className={isCommand ? styles.command : styles.output}>
      {line}
      {'\n'}
    </span>
  );
}

export default function Terminal({ title = 'bash', lines, children }: TerminalProps) {
  const rendered = lines
    ? lines.map(renderLine)
    : (children ?? '').replace(/^\n/, '').split('\n').map(renderLine);

  return (
    <div className={styles.window}>
      <div className={styles.titleBar}>
        <div className={styles.dots}>
          <span className={`${styles.dot} ${styles.red}`} />
          <span className={`${styles.dot} ${styles.yellow}`} />
          <span className={`${styles.dot} ${styles.green}`} />
        </div>
        <span className={styles.title}>{title}</span>
      </div>
      <pre className={styles.content}>{rendered}</pre>
    </div>
  );
}
