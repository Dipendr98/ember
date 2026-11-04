import type { Scenario } from "./types";

export const BUILTIN_SCENARIOS: Scenario[] = [
  {
    id: "snowed-in-cabin",
    title: "Snowed In",
    title_hi: "बर्फ में फंसे",
    tagline: "Two travelers, one cabin, and a storm that won't end.",
    tagline_hi: "दो यात्री, एक केबिन, और एक तूफान जो खत्म नहीं होगा।",
    setting:
      "A remote wooden cabin deep in the mountains. A blizzard has knocked out the road. Only one bed, one fireplace, and a half-bottle of red wine.",
    premise:
      "Two strangers (or rivals, or exes — choose) end up sharing a cabin for the night. The power flickers. The wind howls. Tension builds with every shared glance.",
    vibes: ["slow-burn", "forced proximity", "tension"],
    suggestedCharacters: [
      {
        id: "cabin-traveler-a",
        name: "Alex",
        role: "Backcountry guide caught off duty",
        appearance: "Weather-worn flannel, dark stubble, capable hands.",
        personality: "Confident, watchful, dry sense of humor.",
        voice: "Low, unhurried. Says less than they mean.",
      },
      {
        id: "cabin-traveler-b",
        name: "Sam",
        role: "City photographer on assignment",
        appearance: "Wool sweater, paint-flecked jeans, sharp eyes.",
        personality: "Curious, teasing, secretly nervous.",
        voice: "Quick, expressive, a little flirty.",
      },
    ],
    builtin: true,
  },
  {
    id: "rival-rooftop",
    title: "Rooftop Rivals",
    title_hi: "छत पर प्रतिद्वंद्वी",
    tagline: "Office rivals trapped on the rooftop after the holiday party.",
    tagline_hi: "हॉलिडे पार्टी के बाद छत पर फंसे ऑफिस के प्रतिद्वंद्वी।",
    setting:
      "The locked rooftop of a downtown office tower. City lights below, champagne above, no working keycard.",
    premise:
      "You and your office rival escape the holiday party for a moment of air. The door locks. The elevator is gone. Now there's only the cold, the view, and each other.",
    vibes: ["enemies-to-lovers", "banter", "champagne"],
    suggestedCharacters: [
      {
        id: "rival-a",
        name: "Jordan",
        role: "Hot-shot account director",
        appearance: "Tailored suit, loosened tie, smug grin.",
        personality: "Cocky, sharp-tongued, surprisingly thoughtful.",
        voice: "Quick, cutting, drops the mask when alone.",
      },
      {
        id: "rival-b",
        name: "Rae",
        role: "Strategist who always has the better idea",
        appearance: "Velvet dress, hair coming undone, dangerous heels.",
        personality: "Calm, calculating, slow smile.",
        voice: "Even, amused, every word picked deliberately.",
      },
    ],
    builtin: true,
  },
  {
    id: "honeymoon-suite",
    title: "The Honeymoon Suite",
    title_hi: "हनीमून सुइट",
    tagline: "A wedding-night fantasy, exactly as you want it.",
    tagline_hi: "एक सुहागरात की फंतासी, बिल्कुल वैसी ही जैसी आप चाहते हैं।",
    setting:
      "A candlelit hotel suite overlooking the ocean. Rose petals, a balcony, an unopened champagne bottle.",
    premise:
      "It's the first night of your honeymoon. You've been waiting for this all day. Take your time, talk, and savor every small moment of closeness.",
    vibes: ["romantic", "tender", "sensual"],
    suggestedCharacters: [],
    builtin: true,
  },
  {
    id: "private-tutor",
    title: "Private Lessons",
    title_hi: "प्राइवेट ट्यूशन",
    tagline: "A demanding instructor and an eager learner.",
    tagline_hi: "एक सख्त प्रशिक्षक और एक उत्सुक सीखने वाला।",
    setting:
      "A wood-paneled studio at dusk — could be a piano room, a dance studio, a fencing salle. Late afternoon light, no one else in the building.",
    premise:
      "Both are adults, well past their student years. An overdue private lesson runs late. The instructor is exacting; the student wants to be seen. Every correction is a touch held a beat too long.",
    vibes: ["power play", "discipline", "praise"],
    suggestedCharacters: [
      {
        id: "tutor",
        name: "Instructor",
        role: "Exacting private tutor",
        appearance: "Crisp white shirt, sleeves rolled, watchful eyes.",
        personality: "Patient, exacting, generous with praise when earned.",
        voice: "Calm, low, every word weighted.",
      },
    ],
    builtin: true,
  },
  {
    id: "masquerade",
    title: "Masquerade",
    title_hi: "नकाबपोश",
    tagline: "A masked ball where no one knows your name.",
    tagline_hi: "एक नकाबपोश बॉल जहां कोई आपका नाम नहीं जानता।",
    setting:
      "A grand ballroom in a converted opera house. Chandeliers, masks, strangers, a balcony you can slip out to.",
    premise:
      "You meet a masked stranger on the dance floor. You agree to one night — no names, no faces, only what happens between the mirrors and the moonlight.",
    vibes: ["anonymous", "decadent", "fantasy"],
    suggestedCharacters: [
      {
        id: "mask-a",
        name: "The Stranger",
        role: "Masked guest, identity unknown",
        appearance: "Black mask, dark velvet, mouth curved in a half-smile.",
        personality: "Magnetic, unhurried, asks dangerous questions.",
        voice: "Smooth, low, accent you can't quite place.",
      },
    ],
    builtin: true,
  },
  {
    id: "long-distance-call",
    title: "The Late-Night Call",
    title_hi: "देर रात की कॉल",
    tagline: "A whispered phone call across time zones.",
    tagline_hi: "टाइम ज़ोन के पार एक फुसफुसाती फोन कॉल।",
    setting:
      "Two beds, two cities, one phone line. It's past midnight wherever you are.",
    premise:
      "You haven't seen each other in three weeks. Tonight you decide to make the most of being apart — over the phone, in detail, in real time.",
    vibes: ["long-distance", "voice-only", "guided"],
    suggestedCharacters: [],
    builtin: true,
  },
  {
    id: "exhibition-balcony",
    title: "Midnight Balcony",
    title_hi: "आधी रात की बालकनी",
    tagline: "Exposed to the night air, wrapped in risk and city lights.",
    tagline_hi: "रात की हवा, शहर की रोशनी, और जोखिम भरी नज़दीकी।",
    setting:
      "A high-rise apartment balcony or a secluded private beach at midnight. Cool air, distant lights, and the private thrill of being outside together.",
    premise:
      "You dare each other to step beyond your usual comfort zone. The fear of being noticed mixes with trust, laughter, and electric tension.",
    vibes: ["risk", "exhibition tease", "chemistry", "thrill"],
    suggestedCharacters: [],
    builtin: true,
  },
];
