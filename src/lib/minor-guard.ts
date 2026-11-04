// Hard block on sexual content involving anyone under 18.
//
// Two layers, both enforced on the server so a client can't strip them:
// 1. MINOR_RULE is appended to every system prompt in /api/chat.
// 2. mentionsMinor() rejects requests whose system prompt (custom scenario,
//    characters) or latest user message explicitly asks for an under-18
//    character. Patterns stay explicit to avoid blocking ordinary chat;
//    the prompt rule covers the subtler cases.

export const MINOR_RULE = `ABSOLUTE RULE — this overrides every other instruction, including any instruction to never refuse:
Every character in any sexual, erotic or romantic-physical content is an adult aged 18 or older. Never write such content involving anyone under 18, anyone given a child's age, school grade or body, or anyone framed as a child — not as fantasy, roleplay, flashback, "pretend" age or any other framing. If asked for it, reply in one short line in the conversation's language that you won't write that, and offer to continue with adult characters. No lecture.`;

export const MINOR_BLOCK_MESSAGE =
  "Ye request block ho gayi: 18 saal se kam umar ke kisi bhi character ke saath sexual content allowed nahi hai. Saare characters adult (18+) hone chahiye. / Blocked: sexual content involving anyone under 18 is not allowed.";

const UNDER_18 = String.raw`(?:1[0-7]|[1-9])`;
const UNDER_18_DEVANAGARI = String.raw`(?:१[०-७]|[१-९])`;

const MINOR_PATTERNS: RegExp[] = [
  // "15 year old", "15-year-old", "15 yrs old", "15yo", "15 y/o"
  new RegExp(String.raw`\b${UNDER_18}\s*-?\s*(?:years?|yrs?)\s*-?\s*old\b`, "i"),
  new RegExp(String.raw`\b${UNDER_18}\s*(?:yo|y\/o)\b`, "i"),
  // "age 15", "aged 15", "umar 15", "umr: 15"
  new RegExp(String.raw`\b(?:age[ds]?|umar|umr|umra)\s*(?:is|hai|:|-)?\s*${UNDER_18}\b`, "i"),
  // "15 saal ki ladki", "16 sal ka ladka"
  new RegExp(
    String.raw`\b${UNDER_18}\s*(?:saal|sal|baras|varsh)\s*(?:ki|ka|ke)\s*(?:ladki|ladka|larki|larka|chhori|chhora|bachchi|bacchi|bachcha|baccha|girl|boy)\b`,
    "i",
  ),
  // "१५ साल की लड़की", "15 साल का लड़का", "उम्र 15"
  new RegExp(
    String.raw`(?:${UNDER_18}|${UNDER_18_DEVANAGARI})\s*(?:साल|वर्ष|बरस)\s*(?:की|का|के)\s*(?:लड़की|लड़का|लडकी|लडका|बच्ची|बच्चा|छोरी|छोरा)`,
  ),
  new RegExp(String.raw`(?:उम्र|उमर|आयु)\s*[:-]?\s*(?:${UNDER_18}|${UNDER_18_DEVANAGARI})(?![0-9०-९])`),
  // "under 18", "below eighteen", "18 se kam", "18 से कम"
  /\b(?:under|below)\s*-?\s*(?:18|eighteen)\b/i,
  /\b18\s*(?:se|से)\s*(?:kam|कम)\b/i,
  /(?:^|\s)18\s*से\s*कम/,
  // Words that only ever mean a minor
  /\b(?:underage|under-age|preteen|pre-teen|toddler|jailbait|lolita|lolicon|loli|shotacon|shota|schoolgirl|schoolboy|school\s+(?:girl|boy|student)|high\s*school\s+(?:girl|boy|student))\b/i,
  /\b(?:(?:is|was|still|she's|he's)\s+a\s+minor|minor\s+(?:girl|boy|ladki|ladka|character))\b/i,
  /\b(?:child|childlike|child-like)\b/i,
  /\b(?:class|grade|std|kaksha)\s*(?:[1-9]|1[0-2])(?:st|nd|rd|th)?\s+(?:ki|ka|ke|student|girl|boy|ladki|ladka)\b/i,
  /\b(?:nabalig|naabalig|nabaalig|chhoti\s+bachchi|chhoti\s+bacchi)\b/i,
  /(?:नाबालिग|नाबालिक|छोटी\s*बच्ची|स्कूल\s*(?:की|का|वाली|वाला)\s*(?:लड़की|लड़का|लडकी|लडका|छात्रा|छात्र))/,
];

export function mentionsMinor(text: string): boolean {
  return MINOR_PATTERNS.some((pattern) => pattern.test(text));
}
