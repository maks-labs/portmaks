/**
 * Text that the rain delivers one character at a time. Each character is its own (initially
 * invisible) span that the typography engine switches on when a falling glyph lands on it.
 * Screen readers get the plain string.
 */
export function RainText({ text, group, className }: { text: string; group: number; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={`rt ${className ?? ''}`} data-g={group}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i}>
            <span className="rt-w">{[...w].map((c, j) => <span className="rt-c" key={j}>{c}</span>)}</span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </span>
  )
}
