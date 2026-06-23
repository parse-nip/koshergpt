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

  if (
    lower.includes('talmud') ||
    lower.includes('mishnah') ||
    lower.includes('torah') ||
    lower.includes('rambam') ||
    lower.includes('shulchan') ||
    lower.includes('midrash') ||
    lower.includes('tanakh') ||
    lower.includes('rashi') ||
    lower.includes('ramban')
  ) {
    return 'https://www.sefaria.org';
  }

  return 'https://www.sefaria.org';
}

function extractBulletList(section: string): string[] {
  const items: string[] = [];
  for (const line of section.split('\n')) {
    const cleaned = line.replace(/^[-*•]\s*/, '').trim();
    if (cleaned.length > 0) items.push(cleaned);
  }
  return items;
}

function extractSection(content: string, heading: string, nextHeadings: string[]): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nextPattern = nextHeadings.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`\\*\\*${escaped}\\*\\*:?\\s*\\n?([\\s\\S]*?)(?=\\*\\*(?:${nextPattern})|$)`, 'i');
  const match = content.match(re);
  return match?.[1]?.trim() ?? '';
}

export function parseResponse(content: string): ParsedResponse {
  const sources: Source[] = [];
  const followUps: string[] = [];
  const keyPoints: string[] = [];
  const thinkAbout: string[] = [];
  let summary = '';
  let inDepth = '';
  let yourTurn = '';
  let disclaimer = false;

  if (content.includes('consult your Local Orthodox Rabbi') || content.includes('consult your LOR')) {
    disclaimer = true;
  }

  const followUpSection = extractSection(content, 'Follow-up Questions?', [
    'Sources?',
    'Key Points',
    'Your turn',
    'For you to think about',
  ]);
  if (followUpSection) followUps.push(...extractBulletList(followUpSection));

  const thinkSection = extractSection(content, 'For you to think about', [
    'Follow-up Questions?',
    'Sources?',
    'Key Points',
    'Your turn',
  ]);
  if (thinkSection) thinkAbout.push(...extractBulletList(thinkSection));

  const yourTurnSection = extractSection(content, 'Your turn', [
    'Follow-up Questions?',
    'Sources?',
    'Key Points',
    'For you to think about',
  ]);
  if (yourTurnSection) {
    yourTurn = yourTurnSection.replace(/^[-*•]\s*/, '').trim();
  }

  const sourcesMatch = content.match(/\*\*Sources?\*\*:?\s*\n([\s\S]*?)(?=\*\*(?:Follow-up|Key Points|Your turn|For you to think about)|$)/i);
  if (sourcesMatch) {
    const sourceLines = sourcesMatch[1].split('\n');
    for (const line of sourceLines) {
      const sourceMatch = line.match(/^\[(\d+)\]\s*(.+)/);
      if (sourceMatch) {
        const fullText = sourceMatch[2];
        const urlMatch = fullText.match(/\(?(https?:\/\/[^\s)]+)\)?/);
        const url = urlMatch ? urlMatch[1] : inferUrl(fullText);
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

  const keyPointsSection = extractSection(content, 'Key Points', [
    'In Depth',
    'Sources?',
    'Follow-up Questions?',
    'Your turn',
    'For you to think about',
  ]);
  if (keyPointsSection) keyPoints.push(...extractBulletList(keyPointsSection));

  const summaryMatch = content.match(/\*\*Summary\*\*:?\s*\n?([\s\S]*?)(?=\*\*(?:Key Points|In Depth)|$)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  const inDepthMatch = content.match(/\*\*In Depth\*\*:?\s*\n?([\s\S]*?)(?=\*\*(?:Sources?|Follow-up|Key Points|Your turn|For you to think about)|$)/i);
  if (inDepthMatch) {
    inDepth = inDepthMatch[1].trim();
  }

  if (!summary && !inDepth) {
    const beforeStructured = content.split(/\*\*(?:Sources?|Follow-up Questions?|For you to think about|Your turn|Key Points)\*\*/i)[0] || content;
    inDepth = beforeStructured.replace(/\*\*Follow-up Questions?\*\*[\s\S]*$/, '').trim();
  }

  return { summary, keyPoints, inDepth, sources, followUps, thinkAbout, yourTurn, disclaimer };
}
