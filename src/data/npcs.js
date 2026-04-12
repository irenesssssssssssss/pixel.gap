// NPC definitions, quest content, and gameplay helpers for the Delaware sustainability experience.

const SCALE_CHOICES = [
  { key: "1", label: "1 — rarely or never" },
  { key: "2", label: "2 — occasionally" },
  { key: "3", label: "3 — sometimes" },
  { key: "4", label: "4 — fairly often" },
  { key: "5", label: "5 — consistently" },
];

const PILLAR_CHOICES = [
  { key: "env", label: "Environmental Stewardship" },
  { key: "people", label: "People & Culture" },
  { key: "conduct", label: "Business Conduct" },
  { key: "chain", label: "Responsible Value Chain" },
];

export const OPENING_POVS = {
  env: {
    title: "Wider-Impact Lens",
    routeLabel: "impact-first route",
    routeSummary:
      "you chose to look past the smooth status update and protect the wider impact hidden underneath it.",
    profileTitle: "Wider-Impact Watcher",
    profileSummary:
      "You notice when a project looks fine on the surface but creates bigger consequences underneath, and you would rather name that early than let it compound.",
    town: ["frank", "otis"],
    office: ["suzy", "hazel"],
  },
  people: {
    title: "People-Impact Lens",
    routeLabel: "people-first route",
    routeSummary:
      "you chose to protect the people carrying the cost of pressure before anything else.",
    profileTitle: "People & Culture Advocate",
    profileSummary:
      "You prioritize wellbeing, fairness, and psychological safety, especially when deadlines tempt people to absorb the damage quietly.",
    town: ["otis", "frank"],
    office: ["suzy", "hazel"],
  },
  conduct: {
    title: "Integrity Lens",
    routeLabel: "integrity-first route",
    routeSummary:
      "you chose to stop the moment pressure started bending honesty, process, or professional standards.",
    profileTitle: "Integrity-First Practitioner",
    profileSummary:
      "You place high value on naming the real status clearly, keeping a defensible record, and resisting half-truths that start sounding normal under pressure.",
    town: ["frank", "otis"],
    office: ["suzy", "hazel"],
  },
  chain: {
    title: "Long-Term Trust Lens",
    routeLabel: "long-view route",
    routeSummary:
      "you chose to think beyond tomorrow's checkpoint and protect the longer chain of trust and consequences that follows it.",
    profileTitle: "Long-View Decision Maker",
    profileSummary:
      "You look beyond the immediate meeting and consider how today's compromise shapes trust, decisions, and risk further down the line.",
    town: ["frank", "otis"],
    office: ["hazel", "suzy"],
  },
};

export function getOpeningPov(choiceKey) {
  return OPENING_POVS[choiceKey] || null;
}

export function getOpeningFollowupStep(choiceKey) {
  const followups = {
    env: {
      id: "opening_commitment",
      message:
        "\"your client sponsor says the gaps are manageable and that tomorrow's checkpoint should stay focused on momentum. if you're protecting the wider impact, what cost are you actually willing to take on?\"",
      choices: [
        { key: "name_bigger_risk", label: "name the broader downstream risk now, even if it changes the tone of the checkpoint immediately." },
        { key: "caveat_progress", label: "allow the progress story, but only with explicit caveats about what is still fragile." },
        { key: "escalate_hidden_impact", label: "escalate internally that the current message hides a wider impact the client should not miss." },
        { key: "accept_short_term", label: "let tomorrow stay positive and trust the team to deal with the bigger consequences afterward." },
      ],
    },
    people: {
      id: "opening_commitment",
      message:
        "\"the teammate carrying the extra load says they're fine, but it's obvious they've been absorbing the pressure for weeks. if you keep the human cost at the centre, what are you prepared to do next?\"",
      choices: [
        { key: "intervene_now", label: "raise it now and force a reset, even if that makes tomorrow's conversation more difficult." },
        { key: "protect_quietly", label: "check in privately and redistribute pressure quietly before the checkpoint hits." },
        { key: "document_pattern", label: "document the pattern and push for action the moment the checkpoint pressure passes." },
        { key: "accept_burden", label: "let them carry it a little longer so the team can get through tomorrow intact." },
      ],
    },
    conduct: {
      id: "opening_commitment",
      message:
        "\"your project lead says the deck is 'directionally true' and that fully unpacking the risks tomorrow would only create noise. if you really mean integrity comes first, what do you do when everyone else calls that overreaction?\"",
      choices: [
        { key: "freeze_until_clear", label: "correct the message before the checkpoint, even if you are blamed for slowing things down." },
        { key: "escalate_for_cover", label: "escalate immediately and make someone formally own the gap instead of letting it stay implicit." },
        { key: "limited_exception", label: "allow a narrower message, but only with explicit wording about what is unresolved." },
        { key: "go_with_flow", label: "let the positive version stand and fix the underlying issue after the meeting." },
      ],
    },
    chain: {
      id: "opening_commitment",
      message:
        "\"everyone keeps calling this a temporary compromise for one checkpoint. but you know once a softened story lands well, it often becomes the version people keep using. if you're taking the long view, how far do you push it?\"",
      choices: [
        { key: "reopen_plan", label: "reopen the plan now, even if tomorrow becomes less polished and more uncomfortable." },
        { key: "force_conditions", label: "allow the checkpoint to proceed, but only with explicit assumptions, risks, and next-step conditions." },
        { key: "senior_tradeoff", label: "push the trade-off upward and make the long-term trust risk explicit to leadership." },
        { key: "accept_temporary", label: "accept it as a one-time compromise and trust the team to correct course later." },
      ],
    },
  };

  return followups[choiceKey] || null;
}

export function buildOpeningRouteReaction(choiceKey, commitmentKey = null) {
  const pov = getOpeningPov(choiceKey);
  if (!pov) {
    return "\"good. follow the path to the first zone and find your guide. there's no wrong direction — just an honest one.\"";
  }

  const commitmentMap = {
    name_bigger_risk: "you'd rather make the room uncomfortable now than let a bigger impact stay hidden.",
    caveat_progress: "you can live with momentum, but only if the fragile parts are named out loud.",
    escalate_hidden_impact: "you want the hidden impact surfaced formally, not left underneath a polished story.",
    accept_short_term: "you can feel how easily a short-term success story starts outranking wider consequences.",
    intervene_now: "you'd create discomfort now rather than let people carry harm in silence.",
    protect_quietly: "you want to protect people, but without turning the whole room against the decision.",
    document_pattern: "you notice harm early, even when the system only wants proof after the fact.",
    accept_burden: "you can feel how quickly pressure makes human cost sound temporary and acceptable.",
    freeze_until_clear: "you'd rather take heat for slowing the message than for letting a misleading status harden into fact.",
    escalate_for_cover: "you want the ethical risk owned explicitly, not buried inside team optimism.",
    limited_exception: "you can tolerate a narrow compromise, but only if it is stated clearly and contained.",
    go_with_flow: "you can see how fast a half-true version becomes the normal one once it goes unchallenged.",
    reopen_plan: "you'd rather reopen the plan now than inherit a false sense of security later.",
    force_conditions: "you want any short-term compromise tied to visible conditions and accountability.",
    senior_tradeoff: "you want the long-tail trust risk made explicit before the story settles.",
    accept_temporary: "you can feel how easily a 'temporary' compromise becomes the version everyone keeps working from.",
  };
  const commitmentSummary = commitmentMap[commitmentKey] || "now we know what kind of cost you're willing to carry for that instinct.";

  return `"good. that's a real position, not a slogan. your route begins through a ${pov.routeLabel}, and ${commitmentSummary} you'll meet four guides on the way: Frank on environmental stewardship, Otis on people and culture, Suzy on business conduct, and Hazel on responsible value chain. Frank and Otis are outside first; Suzy and Hazel are waiting inside the Delaware building."`;
}

// ─── NPC ROSTER ─────────────────────────────────────────────────────────────

export const TOWN_NPCS_START = [
  {
    id: "olive",
    name: "Olive the Owl",
    role: "Sustainability Guide",
    x: 24, y: 28,
    dir: "down",
    stationary: true,
    species: "owl",
    patrol: { x1: 22, y1: 26, x2: 26, y2: 30 },
    councilPatrol: { x1: 39, y1: 8, x2: 45, y2: 13 },
  },
  {
    id: "frank",
    name: "Frank the Fish",
    role: "Environmental Stewardship",
    x: 23, y: 18,
    dir: "right",
    stationary: true,
    species: "fish",
    patrol: { x1: 21, y1: 17, x2: 24, y2: 20 },
    councilPatrol: { x1: 39, y1: 8, x2: 45, y2: 13 },
  },
  {
    id: "otis",
    name: "Otis the Otter",
    role: "People & Culture",
    x: 28, y: 13,
    dir: "down",
    stationary: true,
    species: "otter",
    patrol: { x1: 27, y1: 12, x2: 31, y2: 15 },
    councilPatrol: { x1: 41, y1: 8, x2: 46, y2: 13 },
  },
];

export const OFFICE_NPCS_START = [
  {
    id: "suzy",
    name: "Suzy the Sheep",
    role: "Business Conduct",
    x: 6, y: 13,
    dir: "right",
    stationary: true,
    species: "sheep",
    patrol: { x1: 3, y1: 12, x2: 6, y2: 15 },
    councilPatrol: { x1: 39, y1: 9, x2: 43, y2: 13 },
  },
  {
    id: "daisy",
    name: "Daisy the Deer",
    role: "People & Culture",
    x: 11, y: 9,
    dir: "right",
    stationary: false,
    species: "deer",
    patrol: { x1: 9, y1: 8, x2: 13, y2: 11 },
    councilPatrol: { x1: 41, y1: 10, x2: 45, y2: 13 },
  },
  {
    id: "hazel",
    name: "Hazel the Hedgehog",
    role: "Responsible Value Chain",
    x: 18, y: 8,
    dir: "right",
    stationary: true,
    species: "hedgehog",
    patrol: { x1: 17, y1: 7, x2: 20, y2: 9 },
    councilPatrol: { x1: 43, y1: 9, x2: 46, y2: 13 },
  },
  {
    id: "rowan",
    name: "Rowan the Hare",
    role: "Post-Reflection",
    x: 20, y: 8,
    dir: "left",
    stationary: true,
    species: "hare",
    patrol: { x1: 18, y1: 7, x2: 21, y2: 9 },
    councilPatrol: { x1: 42, y1: 10, x2: 46, y2: 13 },
  },
];

// ─── QUEST STAGES ────────────────────────────────────────────────────────────

export const QUEST_STAGES = {
  MEET_OLIVE: "meetOlive",
  BASELINE_DILEMMA: "baselineDilemma",
  TOWN_PILLARS: "townPillars",
  GO_TO_OFFICE: "goToOffice",
  OFFICE_PILLARS: "officePillars",
  RETURN_TO_OLIVE: "returnToOlive",
  POST_GAME: "postGame",
  COMPLETE: "complete",
};

export const TOWN_STATION_IDS = ["frank", "otis"];
export const OFFICE_STATION_IDS = ["suzy", "hazel"];

// ─── OLIVE: BASELINE + OPENING DILEMMA ───────────────────────────────────────

const OLIVE_INTRO_STEPS = [
  {
    id: "baseline_understanding",
    message:
      "Olive the Owl — Sustainability Guide\n\n\"welcome. before we begin, i have three quick questions to understand where you're starting from.\"\n\n\"how well do you feel you currently understand Delaware's sustainability values?\"",
    choices: [
      { key: "1", label: "1 — i have little to no familiarity" },
      { key: "2", label: "2 — i know a little, but not deeply" },
      { key: "3", label: "3 — i have a moderate understanding" },
      { key: "4", label: "4 — i understand them fairly well" },
      { key: "5", label: "5 — i know them very well" },
    ],
  },
  {
    id: "baseline_relevance",
    message: "\"and how relevant do Delaware's sustainability topics feel to your daily work?\"",
    choices: [
      { key: "1", label: "1 — not relevant at all" },
      { key: "2", label: "2 — slightly relevant" },
      { key: "3", label: "3 — somewhat relevant" },
      { key: "4", label: "4 — fairly relevant" },
      { key: "5", label: "5 — very relevant to what i do" },
    ],
  },
  {
    id: "baseline_confidence",
    message: "\"how confident are you in spotting these values in real decisions and everyday work?\"",
    choices: [
      { key: "1", label: "1 — not confident at all" },
      { key: "2", label: "2 — slightly confident" },
      { key: "3", label: "3 — somewhat confident" },
      { key: "4", label: "4 — fairly confident" },
      { key: "5", label: "5 — very confident" },
    ],
  },
  {
    id: "opening_dilemma",
    message:
      "\"good. one more thing before you head out.\"\n\n\"it's late, and tomorrow you have an important client checkpoint. officially the project is on track. in reality, some work is shakier than the status slide suggests, one teammate has been carrying more than people realize, and your client sponsor has already hinted that tomorrow should stay focused on progress, not problems.\"\n\n\"if you're fully candid now, the conversation gets harder, the relationship may become tense, and the plan may slow down. if you stay positive, the meeting goes well, but the client walks away with a cleaner picture than you believe is true.\"\n\n\"when pressure rises like that, which line do you protect first?\"",
    choices: [
      { key: "env", label: "the wider impact. i won't protect today's smooth story if it creates bigger problems underneath." },
      { key: "people", label: "the human cost. i won't let one person quietly absorb the pressure so the meeting still looks good." },
      { key: "conduct", label: "the integrity of the message. i won't present the project as safer or cleaner than i believe it is." },
      { key: "chain", label: "the long-term trust. i won't make tomorrow easier if it weakens the decisions that come after it." },
    ],
  },
];

// ─── FINAL REFLECTION (Olive at council) ─────────────────────────────────────

const FINAL_REFLECTION_STEPS = [
  {
    id: "final_strongest",
    message:
      "Olive the Owl — Council Circle\n\n\"you've walked through all four zones. now let's reflect before you leave.\"\n\n\"which pillar feels strongest in terms of how it shows up in daily practice at Delaware?\"",
    choices: PILLAR_CHOICES,
  },
  {
    id: "final_important",
    message: "\"and which pillar matters most to you personally?\"",
    choices: PILLAR_CHOICES,
  },
  {
    id: "final_gap",
    message: "\"where do you see the biggest gap between Delaware's sustainability ambition and what you experience in practice?\"",
    choices: [
      { key: "env", label: "the environmental side — intentions are there but daily operations don't always reflect it." },
      { key: "people", label: "people and culture — wellbeing and inclusion feel less visible under pressure." },
      { key: "conduct", label: "business conduct — compliance is followed but speaking up still feels uncertain." },
      { key: "chain", label: "the value chain — external responsibility is discussed less than internal performance." },
    ],
  },
  {
    id: "final_focus",
    message: "\"last one. what should Delaware prioritize to close that gap?\"",
    choices: [
      { key: "visible_action", label: "more visible action — less strategy, more tangible change people can see and feel." },
      { key: "culture_safety", label: "a stronger speak-up culture where concerns actually reach the right people." },
      { key: "leadership_model", label: "leadership modeling the values consistently — not just in formal settings." },
      { key: "systems", label: "better systems and measurement to track real progress, not just intentions." },
    ],
  },
];

// ─── POST-GAME (Rowan) ───────────────────────────────────────────────────────

const POST_GAME_STEPS = [
  {
    id: "postGame_understanding",
    message:
      "Rowan the Hare — Post-Reflection\n\n\"one last set of questions before you go. how well do you now feel you understand Delaware's sustainability values — compared to when you started?\"",
    choices: [
      { key: "1", label: "1 — not much clearer than before" },
      { key: "2", label: "2 — slightly clearer" },
      { key: "3", label: "3 — somewhat clearer" },
      { key: "4", label: "4 — fairly clear now" },
      { key: "5", label: "5 — much clearer than before" },
    ],
  },
  {
    id: "postGame_reflection",
    message: "\"did this experience make you reflect differently on how these values show up in your own work?\"",
    choices: [
      { key: "yes", label: "yes — it gave me new ways to think about it." },
      { key: "somewhat", label: "somewhat — it confirmed some things and challenged others." },
      { key: "not_really", label: "not particularly — it matched what i already thought." },
    ],
  },
  {
    id: "postGame_learning",
    message: "\"and how much do you feel you learned through this experience?\"",
    choices: [
      { key: "1", label: "1 — very little" },
      { key: "2", label: "2 — a little" },
      { key: "3", label: "3 — a moderate amount" },
      { key: "4", label: "4 — quite a bit" },
      { key: "5", label: "5 — a lot" },
    ],
  },
];

// ─── PILLAR NPC SEQUENCES ────────────────────────────────────────────────────

const FRANK_PILLAR_STEPS = [
  {
    id: "env_scenario_personal",
    message:
      "Frank the Fish — Environmental Stewardship\n\n\"we've been monitoring this drainage channel. after the last heavy period, runoff from the site has increased. there are options: temporary containment now, or wait six weeks for the full environmental assessment.\"\n\nPlayer\n\"what's the risk of waiting?\"\n\nFrank\n\"the assessment takes six weeks. the runoff doesn't.\"\n\n\"if this were your call, what would you do?\"",
    choices: [
      { key: "act_now", label: "put temporary measures in place now and run the assessment in parallel." },
      { key: "communicate", label: "flag the risk clearly to leadership and let them decide with full information." },
      { key: "wait_process", label: "follow the proper process and wait for the assessment before acting." },
      { key: "escalate", label: "escalate beyond normal channels — this needs to be treated as urgent." },
    ],
  },
  {
    id: "env_scenario_delaware",
    message: "\"and what do you think Delaware leadership would prioritize in this situation?\"",
    choices: [
      { key: "act_now", label: "act now — take temporary measures while the assessment runs." },
      { key: "communicate", label: "communicate the risk upward and let leadership decide." },
      { key: "wait_process", label: "follow process and wait for the full assessment." },
      { key: "escalate", label: "treat it as urgent and escalate beyond standard procedure." },
    ],
  },
  {
    id: "env_scale",
    message: "\"last question from me. how often do you see environmental considerations genuinely shaping real decisions where you work?\"",
    choices: SCALE_CHOICES,
  },
];

const OTIS_PILLAR_STEPS = [
  {
    id: "people_scenario_personal",
    message:
      "Otis the Otter — People & Culture\n\n\"there's a team situation. project pressure is high, and one person has been quietly absorbing extra load for weeks. they haven't said anything officially — but it's visible to anyone paying attention.\"\n\nPlayer\n\"have they been offered support?\"\n\nOtis\n\"not formally. leadership is focused on the delivery deadline.\"\n\n\"what would you do?\"",
    choices: [
      { key: "raise_now", label: "raise it now. waiting makes the pattern harder to break." },
      { key: "check_in", label: "check in privately with the person first, then decide how to raise it." },
      { key: "let_lead", label: "leave it for the team lead or manager to notice through normal channels." },
      { key: "document", label: "document what you're seeing and flag it after the immediate pressure passes." },
    ],
  },
  {
    id: "people_scenario_delaware",
    message: "\"and what do you think Delaware would expect someone to do in this situation?\"",
    choices: [
      { key: "raise_now", label: "raise it now — don't wait." },
      { key: "check_in", label: "check in privately first, then escalate if needed." },
      { key: "let_lead", label: "leave it to the line manager to notice and handle." },
      { key: "document", label: "document and flag after the immediate pressure passes." },
    ],
  },
  {
    id: "people_scale",
    message: "\"one more. how safe does it feel to express a different view or raise a concern in your team?\"",
    choices: SCALE_CHOICES,
  },
];

const SUZY_PILLAR_STEPS = [
  {
    id: "conduct_scenario_personal",
    message:
      "Suzy the Sheep — Business Conduct\n\n\"a colleague shows you a workaround that saves three days of compliance checks. it's not against any written rule, but it bypasses the spirit of the process. other teams apparently do it regularly.\"\n\nPlayer\n\"is there any risk?\"\n\nSuzy\n\"not immediately. but if something goes wrong later, there's no paper trail for why it was skipped.\"\n\n\"what would you do?\"",
    choices: [
      { key: "follow_proper", label: "follow the full process. the shortcut isn't worth the downstream risk." },
      { key: "flag_up", label: "flag the workaround to a manager before deciding — get clarity on whether it's acceptable." },
      { key: "use_workaround", label: "use the workaround this time — it's common practice and the deadline matters." },
      { key: "suggest_review", label: "use it now but suggest a formal review so it's either approved or fixed." },
    ],
  },
  {
    id: "conduct_scenario_delaware",
    message: "\"what do you think Delaware's leadership would expect someone to do here?\"",
    choices: [
      { key: "follow_proper", label: "always follow the full process — no shortcuts." },
      { key: "flag_up", label: "flag it and seek guidance before proceeding." },
      { key: "use_workaround", label: "use common-practice workarounds if everyone else does it." },
      { key: "suggest_review", label: "use it and raise a process review — pragmatic but constructive." },
    ],
  },
  {
    id: "conduct_scale",
    message: "\"and how safe would it feel to raise a concern about a process or compliance issue in your context?\"",
    choices: SCALE_CHOICES,
  },
];

const HAZEL_PILLAR_STEPS = [
  {
    id: "chain_scenario_personal",
    message:
      "Hazel the Hedgehog — Responsible Value Chain\n\n\"there's a supplier decision on the table. the lower-cost option has weaker sustainability standards — their labour and environmental record is mixed. the responsible supplier costs 12% more and takes longer to onboard.\"\n\nPlayer\n\"is there pressure to go with the cheaper option?\"\n\nHazel\n\"there's always pressure. but the contract is long-term. whatever we choose, we're committed to it.\"\n\n\"what matters most to you in this decision?\"",
    choices: [
      { key: "responsible", label: "go with the responsible supplier. the cost difference is worth the alignment." },
      { key: "negotiate", label: "try to negotiate the lower-cost supplier to improve their standards as a condition." },
      { key: "cost", label: "go with the lower-cost option — the business case has to hold up." },
      { key: "escalate", label: "escalate the trade-off to leadership — this is too significant to decide at this level." },
    ],
  },
  {
    id: "chain_scenario_delaware",
    message: "\"what do you think Delaware would prioritize in a supplier decision like this?\"",
    choices: [
      { key: "responsible", label: "choose the responsible supplier even at higher cost." },
      { key: "negotiate", label: "use procurement leverage to push suppliers to improve." },
      { key: "cost", label: "prioritize the business case — sustainability is secondary here." },
      { key: "escalate", label: "escalate significant trade-offs to senior leadership." },
    ],
  },
  {
    id: "chain_scale",
    message: "\"last one. how visible is responsible external decision-making — around suppliers, partners, and longer-term impact — in your everyday work?\"",
    choices: SCALE_CHOICES,
  },
];

// ─── ADAPTIVE FOLLOW-UP STEPS ─────────────────────────────────────────────────

const ADAPTIVE_GAP_STEPS = {
  frank: {
    id: "env_adaptive_gap",
    message: "\"your own choice and what you think Delaware would do seem different. what do you think creates that gap?\"",
    choices: [
      { key: "priorities", label: "different priorities — what matters to individuals vs the organization." },
      { key: "visibility", label: "a lack of visibility — leadership might not see what people on the ground do." },
      { key: "incentives", label: "incentives aren't aligned — people are rewarded for other things." },
      { key: "culture", label: "the culture makes it hard to act on what you believe is right." },
    ],
  },
  otis: {
    id: "people_adaptive_gap",
    message: "\"there seems to be a gap between what you'd do and what you think Delaware would expect. what do you think creates it?\"",
    choices: [
      { key: "priorities", label: "different priorities — individual values vs organizational culture." },
      { key: "visibility", label: "limited visibility upward — concerns don't always reach the people who can act." },
      { key: "incentives", label: "short-term delivery pressure overrides longer-term people considerations." },
      { key: "culture", label: "the culture doesn't consistently make it safe to step in for others." },
    ],
  },
  suzy: {
    id: "conduct_adaptive_gap",
    message: "\"your personal response and what you think Delaware expects seem to differ. what do you think explains that?\"",
    choices: [
      { key: "priorities", label: "compliance culture in theory isn't always what's rewarded in practice." },
      { key: "visibility", label: "leadership might not see the shortcuts that become routine at ground level." },
      { key: "incentives", label: "delivery pressure makes the 'right' path feel like the slow path." },
      { key: "culture", label: "speaking up about process feels risky in a hierarchical environment." },
    ],
  },
  hazel: {
    id: "chain_adaptive_gap",
    message: "\"it looks like your own approach differs from what you'd expect Delaware to prioritize. what creates that gap, in your view?\"",
    choices: [
      { key: "priorities", label: "financial pressure overrides sustainability aspirations in practice." },
      { key: "visibility", label: "supply chain decisions happen at too many levels for central values to reach." },
      { key: "incentives", label: "procurement KPIs are still primarily cost and speed, not responsibility." },
      { key: "culture", label: "sustainability in the value chain is discussed but not yet deeply embedded." },
    ],
  },
};

// ─── NPC REACTIONS ───────────────────────────────────────────────────────────

const PILLAR_REACTIONS = {
  frank: "\"good. the gap between environmental ambition and operational reality is exactly what we're here to understand.\"",
  otis: "\"that's the kind of reflection that matters. people and culture gaps don't fix themselves.\"",
  suzy: "\"appreciated. knowing where the line sits between policy and practice is exactly what this is about.\"",
  hazel: "\"useful. the value chain is one of the hardest places to make sustainability concrete. your view helps.\"",
};

const PILLAR_VISITED_MESSAGES = {
  frank:
    "Frank the Fish — Environmental Stewardship\n\nFrank nods toward the drainage channel. \"the readings don't change just because we've already talked about them. but your view is in the record.\"",
  otis:
    "Otis the Otter — People & Culture\n\nOtis glances back at the building. \"people situations don't resolve neatly. thanks for engaging with it honestly.\"",
  suzy:
    "Suzy the Sheep — Business Conduct\n\nSuzy straightens a stack of folders. \"the conversation about process and shortcuts is never really finished. but we've made a start.\"",
  hazel:
    "Hazel the Hedgehog — Responsible Value Chain\n\nHazel tucks the supplier file away. \"the right supplier decision is rarely obvious. thanks for thinking it through.\"",
};

// ─── PILLAR STEP ID PREFIXES ─────────────────────────────────────────────────
// Used in useGameState to detect personal vs Delaware choices for gap analysis.

export const PILLAR_STEP_PREFIXES = {
  frank: "env",
  otis: "people",
  suzy: "conduct",
  hazel: "chain",
};

// ─── MAIN DIALOG GETTER ──────────────────────────────────────────────────────

export function getNpcDialog(npcId, quest) {
  // ── OLIVE ──────────────────────────────────────────────────────────────────
  if (npcId === "olive") {
    if (quest.stage === QUEST_STAGES.MEET_OLIVE) {
      return {
        type: "info",
        message:
          "Olive the Owl — Sustainability Guide\n\n\"welcome to Delaware's sustainability journey. this is a reflective experience — there are no right or wrong answers here.\"\n\nPlayer\n\"what am i doing exactly?\"\n\nOlive\n\"walking through four zones, meeting the guides, and sharing your honest perspective. your responses are anonymised and help Delaware understand what sustainability looks like in practice.\"",
        advanceTo: QUEST_STAGES.BASELINE_DILEMMA,
      };
    }

    if (quest.stage === QUEST_STAGES.BASELINE_DILEMMA) {
      return {
        type: "sequence",
        steps: OLIVE_INTRO_STEPS,
        reaction:
          "\"good. follow the path to the first zone and find your guide. there's no wrong direction — just an honest one.\"",
        advanceTo: QUEST_STAGES.TOWN_PILLARS,
      };
    }

    if (quest.stage === QUEST_STAGES.RETURN_TO_OLIVE) {
      return {
        type: "sequence",
        steps: FINAL_REFLECTION_STEPS,
        reaction:
          "\"thank you. head over to Rowan before you leave — there are a few last questions.\"",
        advanceTo: QUEST_STAGES.POST_GAME,
      };
    }

    return {
      type: "info",
      message:
        "Olive the Owl — Sustainability Guide\n\nOlive watches the path. \"keep going. there's more to discover in the zones ahead.\"",
    };
  }

  // ── ROWAN ──────────────────────────────────────────────────────────────────
  if (npcId === "rowan") {
    if (quest.stage === QUEST_STAGES.POST_GAME) {
      return {
        type: "sequence",
        steps: POST_GAME_STEPS,
        reaction:
          "\"that's everything. thank you for your honest reflection. your responses will help Delaware understand where the real gaps are.\"",
        advanceTo: QUEST_STAGES.COMPLETE,
      };
    }

    if (quest.stage === QUEST_STAGES.COMPLETE) {
      return {
        type: "info",
        message:
          "Rowan the Hare — Post-Reflection\n\n\"journey complete. the work of closing the gap between ambition and practice is ongoing. your view is part of that.\"",
      };
    }

    return {
      type: "info",
      message:
        "Rowan the Hare — Post-Reflection\n\n\"explore the other zones first. i'll be here when you're ready for the final reflection.\"",
    };
  }

  // ── DAISY (optional ambient NPC) ───────────────────────────────────────────
  if (npcId === "daisy") {
    return {
      type: "info",
      message:
        "Daisy the Deer — People & Culture\n\n\"feel free to explore. every zone you visit adds a piece to the picture. and if you want to understand more about what any of these topics mean in practice, Olive can help.\"",
    };
  }

  // ── PILLAR NPCs ────────────────────────────────────────────────────────────
  if (["frank", "otis", "suzy", "hazel"].includes(npcId)) {
    const beat = quest.pillarBeats?.[npcId] || 0;

    const stepsMap = {
      frank: FRANK_PILLAR_STEPS,
      otis: OTIS_PILLAR_STEPS,
      suzy: SUZY_PILLAR_STEPS,
      hazel: HAZEL_PILLAR_STEPS,
    };

    if (beat === 0) {
      return {
        type: "sequence",
        steps: stepsMap[npcId],
        reaction: PILLAR_REACTIONS[npcId],
        pillarNpcId: npcId,
        adaptiveGapStep: ADAPTIVE_GAP_STEPS[npcId],
      };
    }

    return {
      type: "info",
      message: PILLAR_VISITED_MESSAGES[npcId],
    };
  }

  return null;
}

// ─── OBJECTIVE LABELS ─────────────────────────────────────────────────────────

export function getTaskLabel(quest) {
  const townOrder = quest.pillarOrder?.town || TOWN_STATION_IDS;
  const officeOrder = quest.pillarOrder?.office || OFFICE_STATION_IDS;
  const openingPov = getOpeningPov(quest.openingPov);
  const routeLabel = openingPov?.routeLabel || "chosen route";

  switch (quest.stage) {
    case QUEST_STAGES.MEET_OLIVE:
      return "1. Follow the path to Olive — your sustainability guide.";

    case QUEST_STAGES.BASELINE_DILEMMA:
      return "2. Talk to Olive and answer her opening questions.";

    case QUEST_STAGES.TOWN_PILLARS: {
      const remaining = townOrder.filter((id) => !quest.visited.includes(id));
      if (remaining.length === 0) return "3. Head into the Delaware building.";
      const done = townOrder.length - remaining.length;
      if (remaining.length === 2) {
        return `3. Follow your ${routeLabel} outdoors (${done}/2 complete) — suggested first: ${remaining[0] === "otis" ? "Otis" : "Frank"}.`;
      }
      return `3. Finish the outdoor guides (${done}/2 complete) — next up: ${remaining[0] === "otis" ? "Otis" : "Frank"}.`;
    }

    case QUEST_STAGES.GO_TO_OFFICE:
      return "4. Enter the Delaware building to meet the remaining guides: Suzy and Hazel.";

    case QUEST_STAGES.OFFICE_PILLARS: {
      const remaining = officeOrder.filter((id) => !quest.visited.includes(id));
      if (remaining.length === 0) return "4. Return to the terrace for the council gathering.";
      const done = officeOrder.length - remaining.length;
      if (remaining.length === 2) {
        return `4. Continue your ${routeLabel} inside (${done}/2 complete) — suggested first: ${remaining[0] === "hazel" ? "Hazel" : "Suzy"}.`;
      }
      return `4. Finish the indoor guides (${done}/2 complete) — next up: ${remaining[0] === "hazel" ? "Hazel" : "Suzy"}.`;
    }

    case QUEST_STAGES.RETURN_TO_OLIVE:
      return "5. Walk to your seat at the council table.";

    case QUEST_STAGES.POST_GAME:
      return "6. Speak with Rowan for the final reflection.";

    case QUEST_STAGES.COMPLETE:
      return "Journey complete. Open your Delaware sustainability report.";

    default:
      return "Explore the site.";
  }
}

// ─── LEGACY EXPORTS (kept for backward compatibility) ─────────────────────────

export const REFLECTION_PROMPTS = [];

export function getInspectableById() { return null; }
export function getActiveInspectables() { return []; }
