// NPC definitions, quest content, and gameplay helpers.
// This file stays data-only so the hook can drive the story without JSX.

export const TOWN_NPCS_START = [
  {
    id: "olive",
    name: "Olive the Owl",
    role: "Site Insight Lead",
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
    role: "Environmental Risk & Escalation",
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
    role: "Maintenance & Operations",
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
    role: "Fairness, Allocation & Support",
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
    role: "Workload & Psychological Safety",
    x: 11, y: 9,
    dir: "right",
    stationary: true,
    species: "deer",
    patrol: { x1: 9, y1: 8, x2: 13, y2: 11 },
    councilPatrol: { x1: 41, y1: 10, x2: 45, y2: 13 },
  },
  {
    id: "hazel",
    name: "Hazel the Hedgehog",
    role: "Records, Compliance & Feedback",
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
    role: "Leadership Credibility & Governance",
    x: 20, y: 8,
    dir: "left",
    stationary: true,
    species: "hare",
    patrol: { x1: 18, y1: 7, x2: 21, y2: 9 },
    councilPatrol: { x1: 42, y1: 10, x2: 46, y2: 13 },
  },
];

export const INSPECTABLES = [
  {
    id: "arrivalWaste",
    scene: "town",
    x: 27,
    y: 24,
    label: "overflowing waste point",
    text:
      "Overflowing bags lean against the waste point. Nobody has left a note, but the backlog is visible before anyone says a word.",
  },
  {
    id: "arrivalSign",
    scene: "town",
    x: 19,
    y: 24,
    label: "faded community sign",
    text:
      "The community board is sun-bleached and out of date. Old updates remain pinned long after their usefulness has passed.",
  },
  {
    id: "arrivalLight",
    scene: "town",
    x: 24,
    y: 20,
    label: "broken path light",
    text:
      "The path light hums but barely holds a glow. People still walk here, which means the risk is being absorbed into routine.",
  },
  {
    id: "arrivalWatch",
    scene: "town",
    x: 20,
    y: 24,
    label: "empty safety watch post",
    text:
      "The safety watch post is empty. The chair is tucked in neatly, which somehow makes the absence feel even more normalised.",
  },
  {
    id: "frankTask",
    scene: "town",
    x: 21,
    y: 18,
    label: "river marker",
    text:
      "You clear reeds away from the monitoring edge and uncover the marker line. The latest mark sits above the safe band after the last heavy rain.",
  },
  {
    id: "otisTask",
    scene: "town",
    x: 30,
    y: 13,
    label: "noisy machine",
    text:
      "You stop beside the machine and inspect it properly. It rattles harder than it should and throws off too much heat for a routine day.",
  },
  {
    id: "suzyTask",
    scene: "office",
    x: 6,
    y: 13,
    label: "training kits",
    text:
      "You sort the remaining training kits, protective gear, and support packs. There are only enough complete sets for two groups.",
  },
  {
    id: "daisyTask",
    scene: "office",
    x: 11,
    y: 9,
    label: "reporting pile",
    text:
      "You help Daisy carry folders and boxes between teams. The labels show the same names appearing again and again on the urgent work.",
  },
  {
    id: "hazelTask",
    scene: "office",
    x: 17,
    y: 8,
    label: "archive stack",
    text:
      "You sort incident notes, staff comments, supplier complaints, and meeting summaries into rough piles. The difficult items are easy to spot and easy to postpone.",
  },
];

const OLIVE_DEBRIEF_STEPS = [
  {
    id: "olive_signal",
    message:
      "Olive the Owl — Site Insight Lead\n\n\"alright. now you've seen a few corners. what stood out first?\"",
    choices: [
      { key: "waste", label: "the overflowing waste and mess. basics are slipping." },
      { key: "signs", label: "the outdated signs. communication looks neglected." },
      { key: "attention", label: "the empty watch point and broken light. it feels like attention is missing." },
    ],
  },
  {
    id: "olive_read",
    message:
      "\"and based on that, what's your read of the place?\"",
    choices: [
      { key: "care", label: "people seem to care, but the basics are getting away from them." },
      { key: "distance", label: "it looks alright from a distance, but up close it feels unstable." },
      { key: "visibleRisk", label: "the risks already feel visible. they're just not being named clearly." },
    ],
  },
  {
    id: "olive_fix",
    message:
      "\"if this place could fix one thing first, where would you start?\"",
    choices: [
      { key: "action", label: "visible action on day-to-day problems." },
      { key: "communication", label: "clearer communication with staff and community." },
      { key: "transparency", label: "better transparency on what leadership actually knows." },
    ],
  },
  {
    id: "olive_confidence",
    message:
      "\"last one. how confident are you that leadership sees what people on the ground are seeing?\"",
    choices: [
      { key: "confident", label: "fairly confident." },
      { key: "unsure", label: "somewhat unsure." },
      { key: "notConfident", label: "not confident at all." },
    ],
  },
];

export const STATION_DIALOGS = {
  frank: {
    taskId: "frankTask",
    intro:
      "Frank the Fish — Environmental Risk & Escalation\n\n\"see that line? after heavy rain it keeps creeping above the safe mark.\"\n\nPlayer\n\"has it been reported?\"\n\nFrank\n\"three times. each time the answer was the same: wait for the full report, don't overreact.\"\n\nPlayer\n\"and what do the people working down here think?\"\n\nFrank\n\"they think waiting is how small problems become expensive ones.\"\n\n\"if you were sitting in that discussion, what would you push for first?\"",
    choices: [
      {
        key: "actionFirst",
        label: "put temporary protections in place now and investigate in parallel.",
        reaction: "that's what the grounds crew keeps saying. act early, correct later if needed.",
      },
      {
        key: "transparent",
        label: "share the readings openly so staff and nearby community understand the risk.",
        reaction: "at least then nobody can say they were kept in the dark.",
      },
      {
        key: "wait",
        label: "wait for confirmed reporting before taking action.",
        reaction: "some would call that disciplined. others would call it how problems get buried.",
      },
    ],
    visitedMessage:
      "Frank watches the river and the reporting chain at the same time. Neither feels fully reliable.",
  },
  otis: {
    taskId: "otisTask",
    intro:
      "Otis the Otter — Maintenance & Operations\n\n\"hear that? this unit has been running inefficiently for months.\"\n\nPlayer\n\"can't it just be replaced?\"\n\nOtis\n\"it can. and every report says it should be. lower energy use, fewer breakdowns, safer too.\"\n\nPlayer\n\"so why hasn't it happened?\"\n\nOtis\n\"because quarter-end delivery targets are louder than maintenance requests.\"\n\n\"what would actually convince you leadership cares about a problem like this?\"",
    choices: [
      {
        key: "visibleChange",
        label: "visible operational changes, not just promises.",
        reaction: "same here. people believe the repair they can hear and see, not the promise on a slide.",
      },
      {
        key: "trackedTarget",
        label: "a public target with a date, owner, and progress tracking.",
        reaction: "that's the kind of commitment that survives a busy month.",
      },
      {
        key: "strategyDoc",
        label: "a detailed strategy document that shows they've thought it through.",
        reaction: "planning matters, but around here the machine is still louder than the plan.",
      },
    ],
    visitedMessage:
      "Otis keeps the site running, which means he notices quickly when commitment stays rhetorical.",
  },
  suzy: {
    taskId: "suzyTask",
    intro:
      "Suzy the Sheep — Fairness, Allocation & Support\n\n\"i hate this kind of problem. everyone agrees training matters until there aren't enough places to go around.\"\n\nPlayer\n\"who decides?\"\n\nSuzy\n\"officially? leadership. in practice? whoever makes the strongest case in time.\"\n\nPlayer\n\"and who gets missed most often?\"\n\nSuzy\n\"usually the people least visible.\"\n\n\"if you had to guide the decision, what principle would you use?\"",
    choices: [
      {
        key: "equity",
        label: "prioritize the groups carrying the most risk or load.",
        reaction: "that tends to feel fairest to the people with the most to lose, even when it's uneven on paper.",
      },
      {
        key: "equal",
        label: "split access as evenly as possible.",
        reaction: "clean logic, though equal slices can still leave the highest-risk gaps untouched.",
      },
      {
        key: "negotiate",
        label: "bring the groups together and make them negotiate a shared solution.",
        reaction: "useful if trust is high. harder when the least visible group also has the least leverage.",
      },
    ],
    visitedMessage:
      "Suzy measures fairness by who still gets protected when resources stop being plentiful.",
  },
  daisy: {
    taskId: "daisyTask",
    intro:
      "Daisy the Deer — Workload & Psychological Safety\n\n\"thanks. this is the third time today i've carried someone else's reporting back upstairs.\"\n\nPlayer\n\"is this your job?\"\n\nDaisy\n\"officially? partly. unofficially? whenever something urgent or messy appears, it lands with the same people.\"\n\nPlayer\n\"does leadership know?\"\n\nDaisy\n\"they see the polished outputs. not always the extra labor behind them.\"\n\n\"what would you do if you saw one team carrying more than their share and nobody was saying it out loud?\"",
    choices: [
      {
        key: "raiseNow",
        label: "raise it now. imbalance gets harder to fix the longer it stays invisible.",
        reaction: "that's the brave version. early honesty can feel awkward, but it prevents quiet burnout.",
      },
      {
        key: "raiseCarefully",
        label: "wait and raise it carefully when the timing is right.",
        reaction: "sometimes that's how people protect themselves. the risk is that the pattern gets normalised first.",
      },
      {
        key: "leaveToLeadership",
        label: "leave it for leadership to notice through the normal process.",
        reaction: "i wish that worked more often. hidden workload is good at staying hidden.",
      },
    ],
    visitedMessage:
      "Daisy notices the unpaid labor behind polished reporting, and how often it goes unnamed.",
  },
  hazel: {
    taskId: "hazelTask",
    intro:
      "Hazel the Hedgehog — Records, Compliance & Feedback\n\n\"everyone says they want honesty. what they usually want is honesty after it's been cleaned up.\"\n\nPlayer\n\"what kind of things come through here?\"\n\nHazel\n\"incident logs, anonymous concerns, supplier issues, near-misses, community complaints. all useful. all inconvenient in different ways.\"\n\nPlayer\n\"and what happens to them?\"\n\nHazel\n\"depends who wrote them, who reads them, and whether the timing is politically awkward.\"\n\n\"when uncomfortable feedback reaches leadership, what usually happens?\"",
    choices: [
      {
        key: "traceable",
        label: "it shapes decisions and you can trace the effect.",
        reaction: "when that happens, people stop treating feedback as theatre.",
      },
      {
        key: "parked",
        label: "it gets acknowledged, then quietly parked.",
        reaction: "that's the pattern people fear most: heard just enough to disappear.",
      },
      {
        key: "influence",
        label: "it depends on who is speaking and who has influence.",
        reaction: "politics has a way of editing the record before the record can speak for itself.",
      },
    ],
    visitedMessage:
      "Hazel keeps the paper trail, which means she sees exactly where honesty starts getting filtered.",
  },
  rowan: {
    intro:
      "Rowan the Hare — Governance & Strategy\n\n\"people forgive setbacks more easily than they forgive performance. what they remember is whether leaders were real with them.\"\n\nPlayer\n\"so what counts as real?\"\n\nRowan\n\"that's exactly my question.\"\n\n\"when targets, pressure, and reality all pull in different directions, what makes a leader credible to you?\"",
    choices: [
      {
        key: "followThrough",
        label: "consistent follow-through people can actually observe.",
        reaction: "visible follow-through travels faster than any values statement. people trust what repeats.",
      },
      {
        key: "direction",
        label: "a clear long-term direction, even when execution is uneven.",
        reaction: "direction matters, especially when the road gets messy. it only holds if people can still see the line.",
      },
      {
        key: "signals",
        label: "visible signals that show the organization is moving.",
        reaction: "signals can help. the question is whether they point to substance or simply stand in for it.",
      },
    ],
    visitedMessage:
      "Rowan keeps coming back to the same standard: if people can't feel the follow-through, governance stays abstract.",
  },
};

export const REFLECTION_PROMPTS = [
  {
    id: "followThroughStory",
    speaker: "Olive",
    prompt:
      "tell me about a time leadership followed through on something in a way people could actually feel.",
  },
  {
    id: "decisionDriver",
    speaker: "Hazel",
    prompt:
      "when reports point in different directions, what tends to decide the outcome here: evidence, hierarchy, urgency, or optics?",
  },
  {
    id: "anonymousMessage",
    speaker: "Daisy",
    prompt:
      "if you could send one anonymous message directly to senior leadership, and they had to act on it, what would you say?",
  },
];

export const QUEST_STAGES = {
  MEET_OLIVE: "meetOlive",
  ARRIVAL_INSPECTION: "arrivalInspection",
  OLIVE_DEBRIEF: "oliveDebrief",
  TOWN_STATIONS: "townStations",
  GO_TO_OFFICE: "goToOffice",
  OFFICE_STATIONS: "officeStations",
  RETURN_TO_OLIVE: "returnToOlive",
  COUNCIL_REFLECTION: "councilReflection",
  ROWAN_FINAL: "rowanFinal",
  COMPLETE: "complete",
};

export const ARRIVAL_INSPECTION_IDS = ["arrivalWaste", "arrivalSign", "arrivalLight", "arrivalWatch"];
export const TOWN_STATION_IDS = ["frank", "otis"];
export const OFFICE_STATION_IDS = ["suzy", "daisy", "hazel"];

export function getInspectableById(id) {
  return INSPECTABLES.find((item) => item.id === id) || null;
}

export function getActiveInspectables(quest, scene) {
  return [];
}

export function getNpcDialog(npcId, quest) {
  if (npcId === "olive") {
    if (quest.stage === QUEST_STAGES.MEET_OLIVE) {
      return {
        type: "info",
        message:
          "Olive the Owl — Site Insight Lead\n\n\"first days are useful. you still notice what the rest of us have learned to walk past.\"\n\nPlayer\n\"what am i looking for exactly?\"\n\nOlive\n\"nothing dramatic. just the small things. the places where reality shows through before the meeting slides do.\"",
        advanceTo: QUEST_STAGES.OLIVE_DEBRIEF,
      };
    }

    if (quest.stage === QUEST_STAGES.OLIVE_DEBRIEF) {
      return {
        type: "sequence",
        steps: OLIVE_DEBRIEF_STEPS,
        reaction:
          "first impressions matter because they're often the least rehearsed. now let's see whether the same signals show up at the stations people manage every day.",
        advanceTo: QUEST_STAGES.TOWN_STATIONS,
      };
    }

    if (quest.stage === QUEST_STAGES.RETURN_TO_OLIVE || quest.stage === QUEST_STAGES.COUNCIL_REFLECTION) {
      return {
        type: "reflection",
        title: "Council Gathering",
        role: "End-of-day reflection",
        intro:
          "Olive\n\"you've seen enough to know that this place isn't just what it says in reports. before the day ends, say it plainly.\"",
        prompts: REFLECTION_PROMPTS,
      };
    }

    return {
      type: "info",
        message:
          "Olive keeps treating the campus walk like evidence. The route is simple on purpose: notice what the path itself is trying to show you.",
    };
  }

  if (npcId === "rowan") {
    if (quest.stage === QUEST_STAGES.ROWAN_FINAL) {
      return {
        type: "question",
        message: STATION_DIALOGS.rowan.intro,
        choices: STATION_DIALOGS.rowan.choices,
        advanceTo: QUEST_STAGES.COMPLETE,
      };
    }
    if (quest.stage === QUEST_STAGES.COMPLETE) {
      return { type: "info", message: STATION_DIALOGS.rowan.visitedMessage };
    }
    return {
      type: "info",
      message:
        "Rowan is holding his question until you've walked the full route. He wants your view after the site has had time to contradict itself.",
    };
  }

  const station = STATION_DIALOGS[npcId];
  if (!station) return null;

  if (quest.visited.includes(npcId)) {
    return { type: "info", message: station.visitedMessage };
  }

  return {
    type: "question",
    message: station.intro,
    choices: station.choices,
  };
}

export function getTaskLabel(quest) {
  switch (quest.stage) {
    case QUEST_STAGES.MEET_OLIVE:
      return "1. Follow the main path to Olive at the lookout.";
    case QUEST_STAGES.ARRIVAL_INSPECTION:
    case QUEST_STAGES.OLIVE_DEBRIEF:
      return "2. Listen to Olive's first interpretation of the site.";
    case QUEST_STAGES.TOWN_STATIONS: {
      const remaining = TOWN_STATION_IDS.filter((id) => !quest.visited.includes(id));
      if (remaining.length === 0) return "3. Continue straight into the Delaware building.";
      return `3. Walk up to the outdoor team members in order (${2 - remaining.length}/2 complete): ${remaining.join(" then ")}.`;
    }
    case QUEST_STAGES.GO_TO_OFFICE:
      return "3. Enter the Delaware building to continue indoors.";
    case QUEST_STAGES.OFFICE_STATIONS: {
      const remaining = OFFICE_STATION_IDS.filter((id) => !quest.visited.includes(id));
      if (remaining.length === 0) return "4. Continue to the terrace for the council gathering.";
      return `4. Walk up to the Delaware team members (${3 - remaining.length}/3 complete): ${remaining.join(" then ")}.`;
    }
    case QUEST_STAGES.RETURN_TO_OLIVE:
    case QUEST_STAGES.COUNCIL_REFLECTION:
      return "5. Walk to your seat at the council table.";
    case QUEST_STAGES.ROWAN_FINAL:
      return "6. Answer Rowan's final question on credible leadership.";
    case QUEST_STAGES.COMPLETE:
      return "Route complete. Open your final ESG report.";
    default:
      return "Explore the site.";
  }
}
