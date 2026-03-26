// Central game-state hook.
// Owns scene state, quest flow, movement, and dialog progression.

import { useEffect, useMemo, useRef, useState } from "react";
import { PLAYER_MOVE_MS, NPC_MOVE_MS } from "../constants/game";
import {
  TOWN_NPCS_START,
  OFFICE_NPCS_START,
  QUEST_STAGES,
  TOWN_STATION_IDS,
  OFFICE_STATION_IDS,
  getNpcDialog,
  getTaskLabel,
} from "../data/npcs";
import { SCENES, TOWN_OFFICE_ENTRY, OFFICE_EXIT_TILE, isWalkable } from "../data/scenes";
import { COUNCIL_SEAT } from "../data/townMap";
import { keyFor } from "../engine/mapUtils";
import { chooseNpcMove } from "../engine/npcLogic";
import { logChoice } from "../engine/logger";
import { buildResultsReport, extractQuestionPrompt } from "../engine/results";
import { makePlayerChoiceSegment, parseSpeechSegments } from "../engine/dialogSegments";

const INITIAL_QUEST = {
  stage: QUEST_STAGES.MEET_OLIVE,
  visited: [],
  choices: [],
  inspected: [],
  reflections: {},
};

const AUTO_TRIGGERABLE_STAGES = new Set([
  QUEST_STAGES.MEET_OLIVE,
  QUEST_STAGES.ARRIVAL_INSPECTION,
  QUEST_STAGES.OLIVE_DEBRIEF,
  QUEST_STAGES.TOWN_STATIONS,
  QUEST_STAGES.OFFICE_STATIONS,
  QUEST_STAGES.RETURN_TO_OLIVE,
  QUEST_STAGES.ROWAN_FINAL,
]);

export function useGameState() {
  const keysRef = useRef({});
  const playerRef = useRef(null);
  const townNpcsRef = useRef(null);
  const officeNpcsRef = useRef(null);
  const dialogRef = useRef(null);
  const bannerTimeoutRef = useRef(null);
  const lastAutoTriggerRef = useRef("");
  const lastObjectiveKeyRef = useRef("");
  const resultsAutoOpenedRef = useRef(false);

  const [scene, setScene] = useState("town");
  const [player, setPlayer] = useState({ x: 24, y: 32, dir: "up", step: 0, species: "beaver" });
  const [townNpcs, setTownNpcs] = useState(() => TOWN_NPCS_START.map((n, i) => ({ ...n, step: i % 2 })));
  const [officeNpcs, setOfficeNpcs] = useState(() => OFFICE_NPCS_START.map((n, i) => ({ ...n, step: i % 2 })));
  const [quest, setQuest] = useState(INITIAL_QUEST);
  const [status, setStatus] = useState(getTaskLabel(INITIAL_QUEST));
  const [dialog, setDialog] = useState(null);
  const [banner, setBanner] = useState({ title: "New objective", message: getTaskLabel(INITIAL_QUEST) });
  const [reportOpen, setReportOpen] = useState(false);

  playerRef.current = player;
  townNpcsRef.current = townNpcs;
  officeNpcsRef.current = officeNpcs;
  dialogRef.current = dialog;

  const currentNpcs = useMemo(
    () => (scene === "town" ? townNpcs : officeNpcs),
    [scene, townNpcs, officeNpcs]
  );
  const resultsReport = useMemo(() => buildResultsReport(quest), [quest]);

  const nearbyNpc = useMemo(
    () => currentNpcs.find((n) => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) === 1) || null,
    [currentNpcs, player]
  );
  const nearbyTarget = nearbyNpc;

  const objectiveTarget = useMemo(() => {
    const findTownNpc = (id) => townNpcs.find((npc) => npc.id === id) || null;
    const findOfficeNpc = (id) => officeNpcs.find((npc) => npc.id === id) || null;

    switch (quest.stage) {
      case QUEST_STAGES.MEET_OLIVE:
      case QUEST_STAGES.OLIVE_DEBRIEF:
        return findTownNpc("olive");
      case QUEST_STAGES.COUNCIL_REFLECTION:
        return COUNCIL_SEAT;
      case QUEST_STAGES.RETURN_TO_OLIVE:
        return scene === "office"
          ? { x: OFFICE_EXIT_TILE.x, y: OFFICE_EXIT_TILE.y, label: "terrace door", scene: "office" }
          : COUNCIL_SEAT;
      case QUEST_STAGES.ARRIVAL_INSPECTION:
      case QUEST_STAGES.OLIVE_DEBRIEF:
        return findTownNpc("olive");
      case QUEST_STAGES.TOWN_STATIONS:
        if (!quest.visited.includes("frank")) return findTownNpc("frank");
        if (!quest.visited.includes("otis")) return findTownNpc("otis");
        return { x: TOWN_OFFICE_ENTRY.x, y: TOWN_OFFICE_ENTRY.y, label: "office doorway", scene: "town" };
      case QUEST_STAGES.GO_TO_OFFICE:
        return { x: TOWN_OFFICE_ENTRY.x, y: TOWN_OFFICE_ENTRY.y, label: "office doorway", scene: "town" };
      case QUEST_STAGES.OFFICE_STATIONS:
        if (!quest.visited.includes("suzy")) return findOfficeNpc("suzy");
        if (!quest.visited.includes("daisy")) return findOfficeNpc("daisy");
        if (!quest.visited.includes("hazel")) return findOfficeNpc("hazel");
        return { x: OFFICE_EXIT_TILE.x, y: OFFICE_EXIT_TILE.y, label: "terrace door", scene: "office" };
      case QUEST_STAGES.ROWAN_FINAL:
        return findTownNpc("rowan");
      default:
        return null;
    }
  }, [officeNpcs, quest, scene, townNpcs]);

  const objectiveLabel = objectiveTarget?.label || objectiveTarget?.name || "the highlighted target";

  function flashBanner(title, message, ms = 2200) {
    window.clearTimeout(bannerTimeoutRef.current);
    setBanner({ title, message });
    bannerTimeoutRef.current = window.setTimeout(() => setBanner(null), ms);
  }

  function syncStatus(nextQuest) {
    setStatus(getTaskLabel(nextQuest));
    return nextQuest;
  }

  function dismissDialog() {
    setDialog(null);
  }

  function releaseNpcMovement(npcId) {
    if (!npcId) return;

    const release = (npc) =>
      npc.id !== npcId
        ? npc
        : {
            ...npc,
            stationary: false,
            patrol: npc.councilPatrol || npc.patrol,
          };

    setTownNpcs((prev) => prev.map(release));
    setOfficeNpcs((prev) => prev.map(release));
  }

  function releaseCouncilMovement() {
    setTownNpcs((prev) =>
      prev.map((npc) => ({
        ...npc,
        stationary: false,
        patrol: npc.councilPatrol || npc.patrol,
      }))
    );
  }

  function closeResultsReport() {
    setReportOpen(false);
  }

  function openResultsReport() {
    setReportOpen(true);
  }

  function recordChoice(dialogState, choice) {
    logChoice({
      npcId: dialogState.npcId,
      choiceKey: `${dialogState.stepId || dialogState.npcId}:${choice.key}`,
      choiceLabel: choice.label,
    });
  }

  function applyQuestAdvance(prevQuest, advanceTo, npcId = null) {
    let next = prevQuest;

    if (npcId && !next.visited.includes(npcId)) {
      next = { ...next, visited: [...next.visited, npcId] };
    }

    if (advanceTo) {
      next = { ...next, stage: advanceTo };
    } else if (
      next.stage === QUEST_STAGES.TOWN_STATIONS &&
      TOWN_STATION_IDS.every((id) => next.visited.includes(id))
    ) {
      next = { ...next, stage: QUEST_STAGES.GO_TO_OFFICE };
    } else if (
      next.stage === QUEST_STAGES.OFFICE_STATIONS &&
      OFFICE_STATION_IDS.every((id) => next.visited.includes(id))
    ) {
      next = { ...next, stage: QUEST_STAGES.RETURN_TO_OLIVE };
    }

    return syncStatus(next);
  }

  function openSequenceDialog(npc, dialogData) {
    const firstStep = dialogData.steps[0];
    setDialog({
      type: "sequence",
      phase: "question",
      npcId: npc.id,
      npcName: npc.name,
      npcRole: npc.role,
      history: [],
      steps: dialogData.steps,
      stepIndex: 0,
      stepId: firstStep.id,
      message: firstStep.message,
      choices: firstStep.choices,
      reaction: dialogData.reaction,
      advanceTo: dialogData.advanceTo || null,
    });
  }

  function openQuestionDialog(npc, dialogData) {
    setDialog({
      type: "question",
      phase: "question",
      npcId: npc.id,
      npcName: npc.name,
      npcRole: npc.role,
      history: [],
      message: dialogData.message,
      choices: dialogData.choices,
      advanceTo: dialogData.advanceTo || null,
    });
  }

  function openInfoDialog(npc, message, advanceTo = null) {
    setDialog({
      type: "info",
      phase: "info",
      npcId: npc?.id || null,
      npcName: npc?.name || null,
      npcRole: npc?.role || null,
      history: [],
      message,
      advanceTo,
    });
  }

  function openReflectionDialog(npc, dialogData) {
    setDialog({
      type: "reflection",
      phase: "reflection",
      npcId: npc.id,
      npcName: dialogData.title || npc.name,
      npcRole: dialogData.role || npc.role,
      message: dialogData.intro,
      prompts: dialogData.prompts,
      initialValues: quest.reflections,
    });
  }

  function handleChoice(choice) {
    const current = dialogRef.current;
    if (!current || current.phase !== "question") return;

    recordChoice(current, choice);

    setQuest((prev) => {
      const history = [
        ...(current.history || []),
        ...parseSpeechSegments(current, current.message),
        makePlayerChoiceSegment(choice.label),
      ];

      const next = {
        ...prev,
        choices: [
          ...prev.choices,
          {
            npcId: current.npcId,
            npcName: current.npcName,
            npcRole: current.npcRole,
            stepId: current.stepId || current.npcId,
            prompt: extractQuestionPrompt(current.message),
            choiceKey: choice.key,
            choiceLabel: choice.label,
          },
        ],
      };

      if (current.type === "sequence") {
        const nextStepIndex = current.stepIndex + 1;
        const nextStep = current.steps[nextStepIndex];

        if (nextStep) {
          setDialog({
            ...current,
            history,
            stepIndex: nextStepIndex,
            stepId: nextStep.id,
            message: nextStep.message,
            choices: nextStep.choices,
          });
          return next;
        }

        const advanced = applyQuestAdvance(next, current.advanceTo, current.npcId);
        setDialog({
          type: "reaction",
          phase: "reaction",
          npcId: current.npcId,
          npcName: current.npcName,
          npcRole: current.npcRole,
          history,
          reaction: current.reaction,
        });
        return advanced;
      }

      const advanced = applyQuestAdvance(next, current.advanceTo || null, current.npcId);
      setDialog({
        type: "reaction",
        phase: "reaction",
        npcId: current.npcId,
        npcName: current.npcName,
        npcRole: current.npcRole,
        history,
        reaction: choice.reaction,
      });
      return advanced;
    });
  }

  function handleAdvanceDialog() {
    const current = dialogRef.current;
    if (!current || (current.phase !== "info" && current.phase !== "reaction")) return;

    const shouldReleaseCurrentNpc =
      !!current.npcId && (current.phase === "reaction" || quest.visited.includes(current.npcId));

    dismissDialog();

    if (current.phase === "info" && current.advanceTo) {
      setQuest((prev) => applyQuestAdvance(prev, current.advanceTo));
    }

    if (quest.stage === QUEST_STAGES.COMPLETE && current.npcId === "rowan") {
      releaseCouncilMovement();
      return;
    }

    if (shouldReleaseCurrentNpc) {
      releaseNpcMovement(current.npcId);
    }
  }

  function handleReflectionSubmit(values) {
    dismissDialog();
    setQuest((prev) => syncStatus({ ...prev, reflections: values, stage: QUEST_STAGES.ROWAN_FINAL }));
  }

  function handleNpcInteraction(npc) {
    const dialogData = getNpcDialog(npc.id, quest);
    if (!dialogData) return;

    if (dialogData.type === "info") {
      openInfoDialog(npc, dialogData.message, dialogData.advanceTo || null);
      return;
    }

    if (dialogData.type === "sequence") {
      openSequenceDialog(npc, dialogData);
      return;
    }

    if (dialogData.type === "reflection") {
      openReflectionDialog(npc, dialogData);
      setQuest((prev) => syncStatus({ ...prev, stage: QUEST_STAGES.COUNCIL_REFLECTION }));
      return;
    }

    openQuestionDialog(npc, dialogData);
  }

  function enterOffice() {
    setScene("office");
    setPlayer((prev) => ({ ...prev, x: 3, y: 14, dir: "right" }));
    setQuest((prev) => {
      const next =
        prev.stage === QUEST_STAGES.GO_TO_OFFICE ? { ...prev, stage: QUEST_STAGES.OFFICE_STATIONS } : prev;
      flashBanner("New objective", getTaskLabel(next));
      return syncStatus(next);
    });
    dismissDialog();
  }

  function exitOffice() {
    setScene("town");
    setPlayer((prev) => ({ ...prev, x: 36, y: 9, dir: "right" }));
    setQuest((prev) => syncStatus(prev));
    dismissDialog();
  }

  useEffect(() => {
    if (quest.stage !== QUEST_STAGES.COMPLETE) return;
    if (dialogRef.current) return;
    if (resultsAutoOpenedRef.current) return;

    resultsAutoOpenedRef.current = true;
    setReportOpen(true);
    flashBanner("Report ready", "Your ESG profile and answer summary are ready.", 2600);
  }, [quest.stage, dialog]);

  useEffect(() => {
    if (
      quest.stage === QUEST_STAGES.RETURN_TO_OLIVE ||
      quest.stage === QUEST_STAGES.COUNCIL_REFLECTION ||
      quest.stage === QUEST_STAGES.ROWAN_FINAL ||
      quest.stage === QUEST_STAGES.COMPLETE
    ) {
      // Pull office NPCs before the state update so they're available in the closure.
      const offNpcs = officeNpcsRef.current;
      const suzy  = offNpcs.find((n) => n.id === "suzy")  || OFFICE_NPCS_START[0];
      const daisy = offNpcs.find((n) => n.id === "daisy") || OFFICE_NPCS_START[1];
      const hazel = offNpcs.find((n) => n.id === "hazel") || OFFICE_NPCS_START[2];
      const rowanSrc = offNpcs.find((n) => n.id === "rowan") || OFFICE_NPCS_START[3];

      setTownNpcs((prev) => {
        const olive = prev.find((npc) => npc.id === "olive") || TOWN_NPCS_START[0];
        const frank = prev.find((npc) => npc.id === "frank") || TOWN_NPCS_START[1];
        const otis  = prev.find((npc) => npc.id === "otis")  || TOWN_NPCS_START[2];
        const rowan = prev.find((npc) => npc.id === "rowan") || rowanSrc;

        // All 7 council members seated around the oval table (x=42-45, y=9-11).
        // Chairs face inward toward the table centre.
        return [
          { ...olive, x: 43, y:  8, dir: "down",  stationary: true, step: 0 },
          { ...frank, x: 40, y:  8, dir: "down",  stationary: true, step: 0 },
          { ...otis,  x: 46, y:  8, dir: "down",  stationary: true, step: 0 },
          { ...suzy,  x: 40, y: 11, dir: "right", stationary: true, step: 0 },
          { ...hazel, x: 46, y: 11, dir: "left",  stationary: true, step: 0 },
          { ...daisy, x: 42, y: 13, dir: "up",    stationary: true, step: 0 },
          { ...rowan, x: 44, y: 12, dir: "left",  stationary: true, step: 0 },
        ];
      });
    }
  }, [quest.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = `${quest.stage}:${objectiveLabel}`;
    if (lastObjectiveKeyRef.current === key) return;
    lastObjectiveKeyRef.current = key;
    lastAutoTriggerRef.current = "";
    flashBanner("New objective", getTaskLabel(quest));
  }, [objectiveLabel, quest]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedProgress = {
      updatedAt: new Date().toISOString(),
      stage: quest.stage,
      choices: quest.choices,
      reflections: quest.reflections,
    };

    try {
      window.localStorage.setItem("pixel-gap-answer-cache", JSON.stringify(savedProgress));
    } catch {
      // Ignore storage issues so gameplay never breaks.
    }
  }, [quest.choices, quest.reflections, quest.stage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (quest.stage !== QUEST_STAGES.COMPLETE) return;

    try {
      window.localStorage.setItem("pixel-gap-latest-report", JSON.stringify(resultsReport));
    } catch {
      // Ignore storage issues so the ending still works without persistence.
    }
  }, [quest.stage, resultsReport]);

  useEffect(() => {
    if (!objectiveTarget || (objectiveTarget.scene && objectiveTarget.scene !== scene)) return;
    if (dialogRef.current) return;
    if (!AUTO_TRIGGERABLE_STAGES.has(quest.stage)) return;

    const targetKey = `${scene}:${quest.stage}:${objectiveTarget.id || objectiveTarget.label || objectiveTarget.name}`;
    const distance = Math.abs(objectiveTarget.x - player.x) + Math.abs(objectiveTarget.y - player.y);
    if (distance > 1) return;
    if (lastAutoTriggerRef.current === targetKey) return;
    lastAutoTriggerRef.current = targetKey;

    // Council seat — player walks onto their chair to open the reflection dialog.
    if (objectiveTarget.id === "councilSeat") {
      const oliveNpc = currentNpcs.find((n) => n.id === "olive");
      if (oliveNpc) handleNpcInteraction(oliveNpc);
      return;
    }

    const npcMatch = currentNpcs.find((npc) => npc.id === objectiveTarget.id);
    if (npcMatch) {
      handleNpcInteraction(npcMatch);
      return;
    }

  }, [currentNpcs, objectiveTarget, player, quest.stage, scene]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sceneData = SCENES[scene];

    function tryMove(dx, dy, dir) {
      if (reportOpen) return;
      if (dialogRef.current?.phase === "question" || dialogRef.current?.phase === "reflection") return;

      setPlayer((prev) => {
        const nx = prev.x + dx;
        const ny = prev.y + dy;
        const occupied = new Set(currentNpcs.map((n) => keyFor(n.x, n.y)));
        if (!isWalkable(sceneData, nx, ny, occupied)) return { ...prev, dir };

        const next = { ...prev, x: nx, y: ny, dir, step: prev.step ^ 1 };

        if (scene === "town" && nx === TOWN_OFFICE_ENTRY.x && ny === TOWN_OFFICE_ENTRY.y) {
          if (quest.stage === QUEST_STAGES.GO_TO_OFFICE || quest.stage === QUEST_STAGES.OFFICE_STATIONS) {
            window.setTimeout(() => enterOffice(), 0);
          }
        }

        if (scene === "office" && nx === OFFICE_EXIT_TILE.x && ny === OFFICE_EXIT_TILE.y) {
          if (
            quest.stage === QUEST_STAGES.RETURN_TO_OLIVE ||
            quest.stage === QUEST_STAGES.COUNCIL_REFLECTION ||
            quest.stage === QUEST_STAGES.ROWAN_FINAL ||
            quest.stage === QUEST_STAGES.COMPLETE
          ) {
            window.setTimeout(() => exitOffice(), 0);
          }
        }

        return next;
      });
    }

    function onKeyDown(e) {
      const valid = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", " "];
      if (valid.includes(e.key)) e.preventDefault();
      keysRef.current[e.key] = true;

      if (reportOpen) {
        if (e.key === "Escape") closeResultsReport();
        return;
      }

      if (e.key === " ") {
        if (dialogRef.current?.phase === "info" || dialogRef.current?.phase === "reaction") {
          handleAdvanceDialog();
        } else {
          flashBanner("Current objective", getTaskLabel(quest), 1800);
        }
      }
    }

    function onKeyUp(e) {
      keysRef.current[e.key] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let lastMove = 0;
    const loop = window.setInterval(() => {
      const now = Date.now();
      if (now - lastMove < PLAYER_MOVE_MS) return;
      const k = keysRef.current;

      if (k.ArrowUp || k.w || k.W) {
        tryMove(0, -1, "up");
        lastMove = now;
      } else if (k.ArrowDown || k.s || k.S) {
        tryMove(0, 1, "down");
        lastMove = now;
      } else if (k.ArrowLeft || k.a || k.A) {
        tryMove(-1, 0, "left");
        lastMove = now;
      } else if (k.ArrowRight || k.d || k.D) {
        tryMove(1, 0, "right");
        lastMove = now;
      }
    }, 20);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.clearInterval(loop);
    };
  }, [currentNpcs, quest, reportOpen, scene]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loop = window.setInterval(() => {
      const mover = (setter, key) =>
        setter((prev) =>
          prev.map((npc) => {
            const occupied = new Set(prev.filter((other) => other.id !== npc.id).map((other) => keyFor(other.x, other.y)));
            return chooseNpcMove(key, npc, occupied, playerRef.current);
          })
        );

      if (scene === "town") mover(setTownNpcs, "town");
      else mover(setOfficeNpcs, "office");
    }, NPC_MOVE_MS);

    return () => window.clearInterval(loop);
  }, [scene]);

  useEffect(() => () => window.clearTimeout(bannerTimeoutRef.current), []);

  return {
    scene,
    player,
    townNpcs,
    officeNpcs,
    quest,
    status,
    banner,
    dialog,
    playerRef,
    townNpcsRef,
    officeNpcsRef,
    currentNpcs,
    nearbyNpc,
    nearbyTarget,
    objectiveTarget,
    objectiveLabel,
    reportOpen,
    resultsReport,
    handleChoice,
    handleAdvanceDialog,
    handleReflectionSubmit,
    closeResultsReport,
    openResultsReport,
  };
}
