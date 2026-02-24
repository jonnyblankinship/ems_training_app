'use client';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Lightweight markdown renderer — no external dependencies
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  function renderInline(text: string): React.ReactNode {
    // Bold: **text** or __text__
    // Italic: *text* or _text_
    // Inline code: `code`
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/s);
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/s);

      if (boldMatch && (!codeMatch || boldMatch[1].length <= codeMatch[1].length)) {
        if (boldMatch[1]) parts.push(<span key={key++}>{renderInline(boldMatch[1])}</span>);
        parts.push(<strong key={key++} className="font-semibold">{renderInline(boldMatch[2])}</strong>);
        remaining = boldMatch[3];
      } else if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={key++}>{renderInline(codeMatch[1])}</span>);
        parts.push(
          <code key={key++} className="bg-slate-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        remaining = '';
      }
    }

    return parts.length === 1 ? parts[0] : parts;
  }

  while (i < lines.length) {
    const line = lines[i];

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-red-800 mt-4 mb-1 first:mt-0">
          {line.slice(4)}
        </h3>
      );
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-red-900 mt-5 mb-2 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    }
    // H1
    else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-red-900 mt-4 mb-2 first:mt-0">
          {line.slice(2)}
        </h1>
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="border-slate-200 my-3" />);
    }
    // Unordered list item
    else if (line.match(/^(\s*)[-*+] /)) {
      const match = line.match(/^(\s*)[-*+] (.*)$/);
      if (match) {
        const indent = match[1].length;
        elements.push(
          <li key={i} className={`flex gap-2 ${indent > 0 ? 'ml-4' : ''} text-sm leading-relaxed`}>
            <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
            <span>{renderInline(match[2])}</span>
          </li>
        );
      }
    }
    // Numbered list item
    else if (line.match(/^\d+\. /)) {
      const match = line.match(/^(\d+)\. (.*)$/);
      if (match) {
        elements.push(
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-red-600 font-semibold flex-shrink-0 min-w-[1.2rem]">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </li>
        );
      }
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}
