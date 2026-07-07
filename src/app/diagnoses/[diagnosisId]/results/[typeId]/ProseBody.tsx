// Renders prose text as clean paragraphs.
// Normalizes line endings, treats 2+ consecutive newlines as paragraph breaks,
// and collapses single newlines within a paragraph (Japanese text — no space added).
// Use instead of whitespace: pre-line or split(/\n+/) throughout result pages.

interface Props {
  text: string;
  /** CSS classes applied to the wrapping <div> (e.g. spacing utilities like "space-y-4") */
  className?: string;
  /** CSS classes applied to each <p> element */
  paragraphClassName?: string;
  style?: React.CSSProperties;
}

export function ProseBody({ text, className, paragraphClassName, style }: Props) {
  const paragraphs = text
    .replace(/\r\n|\r/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.replace(/\n/g, "").trim())
    .filter((para) => para.trim().length > 0);

  return (
    <div className={className} style={style}>
      {paragraphs.map((para, i) => (
        <p key={i} className={paragraphClassName}>
          {para}
        </p>
      ))}
    </div>
  );
}
