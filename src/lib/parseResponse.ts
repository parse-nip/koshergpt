import type { ParsedResponse, Source } from '../types/chat';

const SOURCE_URL_MAP: Record<string, string> = {
  'sefaria': 'https://www.sefaria.org',
  'chabad': 'https://www.chabad.org',
  'ou.org': 'https://www.ou.org',
  'torah.org': 'https://www.torah.org',
  'my jewish learning': 'https://www.myjewishlearning.com',
  'aish': 'https://www.aish.com',
};

function inferUrl(title: string): string {
  const lower = title.toLowerCase();

  for (const [key, url] of Object.entries(SOURCE_URL_MAP)) {
    if (lower.includes(key)) return url;
  }

  if (lower.includes('talmud') || lower.includes('mishnah') || lower.includes('torah') ||
      lower.includes('rambam') || lower.includes('shulchan') || lower.includes('midrash') ||
      lower.includes('tanakh') || lower.includes('rashi') || lower.includes('ramban')) {
    return 'https://www.sefaria.org';
  }

  return 'https://www.sefaria.org';
}

export function parseResponse(content: string): ParsedResponse {
  const sources: Source[] = [];
  const followUps: string[] = [];
  let summary = '';
  let inDepth = '';
  let disclaimer = false;

  if (content.includes('consult your Local Orthodox Rabbi') || content.includes('consult your LOR')) {
    disclaimer = true;
  }

  // Extract follow-up questions
  const followUpMatch = content.match(/\*\*Follow-up Questions?\*\*:?\s*\n([\s\S]*?)$/);
  if (followUpMatch) {
    const followUpLines = followUpMatch[1].split('\n');
    for (const line of followUpLines) {
      const cleaned = line.replace(/^[-*]\s*/, '').trim();
      if (cleaned.length > 0) {
        followUps.push(cleaned);
      }
    }
  }

  // Extract sources section
  const sourcesMatch = content.match(/\*\*Sources?\*\*:?\s*\n([\s\S]*?)(?=\*\*Follow-up|$)/);
  if (sourcesMatch) {
    const sourceLines = sourcesMatch[1].split('\n');
    for (const line of sourceLines) {
      const sourceMatch = line.match(/^\[(\d+)\]\s*(.+)/);
      if (sourceMatch) {
        const fullText = sourceMatch[2];

        // Extract URL from parenthetical at end: (https://...)
        const urlMatch = fullText.match(/\(?(https?:\/\/[^\s)]+)\)?/);
        const url = urlMatch ? urlMatch[1] : inferUrl(fullText);

        // Remove the URL portion from the display text
        const cleanText = fullText.replace(/\s*\(?https?:\/\/[^\s)]+\)?\s*$/, '');
        const title = cleanText.split('—')[0]?.trim() || cleanText.trim();
        const description = cleanText.split('—')[1]?.trim() || '';

        sources.push({
          number: parseInt(sourceMatch[1]),
          title,
          description,
          url,
        });
      }
    }
  }

  // Extract summary
  const summaryMatch = content.match(/\*\*Summary\*\*:?\s*\n?([\s\S]*?)(?=\*\*In Depth|$)/);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  // Extract in-depth
  const inDepthMatch = content.match(/\*\*In Depth\*\*:?\s*\n?([\s\S]*?)(?=\*\*Sources?|$)/);
  if (inDepthMatch) {
    inDepth = inDepthMatch[1].trim();
  }

  if (!summary && !inDepth) {
    const beforeSources = content.split(/\*\*Sources?\*\*/)[0] || content;
    inDepth = beforeSources.replace(/\*\*Follow-up Questions?\*\*[\s\S]*$/, '').trim();
  }

  return { summary, inDepth, sources, followUps, disclaimer };
}
