import type { GameTag, RankTier } from "../types";

export interface PlatformDef {
  id: string;
  label: string;
  placeholder: string;
}

export interface GameDef {
  id: GameTag;
  label: string;
  short: string;
  color: string;
  icon: string;
  platforms: PlatformDef[];
  ranks: RankTier[];
  maxPlayers: number; // max lobby size (min is always 2)
}

export const GAMES: GameDef[] = [
  {
    id: "Valorant",
    label: "Valorant",
    short: "VAL",
    color: "#ff4655",
    icon: "⬡",
    platforms: [{ id: "riot", label: "Riot ID", placeholder: "Player#TAG" }],
    ranks: [
      { label: "Iron", ordinal: 0 },
      { label: "Bronze", ordinal: 1 },
      { label: "Silver", ordinal: 2 },
      { label: "Gold", ordinal: 3 },
      { label: "Platinum", ordinal: 4 },
      { label: "Diamond", ordinal: 5 },
      { label: "Ascendant", ordinal: 6 },
      { label: "Immortal", ordinal: 7 },
      { label: "Radiant", ordinal: 8 },
    ],
    maxPlayers: 5,
  },
  {
    id: "Fortnite",
    label: "Fortnite",
    short: "FN",
    color: "#00d4ff",
    icon: "⚡",
    platforms: [{ id: "epic", label: "Epic Username", placeholder: "YourUsername" }],
    ranks: [
      { label: "Bronze", ordinal: 0 },
      { label: "Silver", ordinal: 1 },
      { label: "Gold", ordinal: 2 },
      { label: "Platinum", ordinal: 3 },
      { label: "Diamond", ordinal: 4 },
      { label: "Elite", ordinal: 5 },
      { label: "Champion", ordinal: 6 },
      { label: "Unreal", ordinal: 7 },
    ],
    maxPlayers: 4,
  },
  {
    id: "LeagueOfLegends",
    label: "League of Legends",
    short: "LoL",
    color: "#c89b3c",
    icon: "⚔",
    platforms: [{ id: "riot", label: "Riot ID", placeholder: "Player#TAG" }],
    ranks: [
      { label: "Iron", ordinal: 0 },
      { label: "Bronze", ordinal: 1 },
      { label: "Silver", ordinal: 2 },
      { label: "Gold", ordinal: 3 },
      { label: "Platinum", ordinal: 4 },
      { label: "Emerald", ordinal: 5 },
      { label: "Diamond", ordinal: 6 },
      { label: "Master", ordinal: 7 },
      { label: "Grandmaster", ordinal: 8 },
      { label: "Challenger", ordinal: 9 },
    ],
    maxPlayers: 5,
  },
  {
    id: "CS2",
    label: "CS2",
    short: "CS2",
    color: "#e8a249",
    icon: "◎",
    platforms: [
      {
        id: "steam",
        label: "Steam Profile URL",
        placeholder: "https://steamcommunity.com/id/...",
      },
    ],
    ranks: [
      { label: "Silver I", ordinal: 0 },
      { label: "Silver IV", ordinal: 1 },
      { label: "Silver Elite", ordinal: 2 },
      { label: "Gold Nova I", ordinal: 3 },
      { label: "Gold Nova III", ordinal: 4 },
      { label: "MG1", ordinal: 5 },
      { label: "MG2", ordinal: 6 },
      { label: "MGE", ordinal: 7 },
      { label: "DMG", ordinal: 8 },
      { label: "LE", ordinal: 9 },
      { label: "LEM", ordinal: 10 },
      { label: "Supreme", ordinal: 11 },
      { label: "Global Elite", ordinal: 12 },
    ],
    maxPlayers: 5,
  },
  {
    id: "ApexLegends",
    label: "Apex Legends",
    short: "APX",
    color: "#cc2f40",
    icon: "◈",
    platforms: [{ id: "ea", label: "EA Username", placeholder: "YourUsername" }],
    ranks: [
      { label: "Bronze", ordinal: 0 },
      { label: "Silver", ordinal: 1 },
      { label: "Gold", ordinal: 2 },
      { label: "Platinum", ordinal: 3 },
      { label: "Diamond", ordinal: 4 },
      { label: "Master", ordinal: 5 },
      { label: "Predator", ordinal: 6 },
    ],
    maxPlayers: 3,
  },
  {
    id: "Overwatch2",
    label: "Overwatch 2",
    short: "OW2",
    color: "#f99e1a",
    icon: "⊕",
    platforms: [
      { id: "battle.net", label: "BattleTag", placeholder: "Player#12345" },
    ],
    ranks: [
      { label: "Bronze", ordinal: 0 },
      { label: "Silver", ordinal: 1 },
      { label: "Gold", ordinal: 2 },
      { label: "Platinum", ordinal: 3 },
      { label: "Diamond", ordinal: 4 },
      { label: "Master", ordinal: 5 },
      { label: "Grandmaster", ordinal: 6 },
      { label: "Champion", ordinal: 7 },
    ],
    maxPlayers: 6,
  },
  {
    id: "RocketLeague",
    label: "Rocket League",
    short: "RL",
    color: "#5b9bd5",
    icon: "◉",
    platforms: [
      { id: "epic", label: "Epic Username", placeholder: "YourUsername" },
    ],
    ranks: [
      { label: "Bronze", ordinal: 0 },
      { label: "Silver", ordinal: 1 },
      { label: "Gold", ordinal: 2 },
      { label: "Platinum", ordinal: 3 },
      { label: "Diamond", ordinal: 4 },
      { label: "Champion", ordinal: 5 },
      { label: "Grand Champion", ordinal: 6 },
      { label: "Supersonic Legend", ordinal: 7 },
    ],
    maxPlayers: 3,
  },
  {
    id: "MarvelRivals",
    label: "Marvel Rivals",
    short: "MR",
    color: "#e44d7b",
    icon: "◆",
    platforms: [
      {
        id: "marvel",
        label: "Marvel ID",
        placeholder: "YourUsername",
      },
    ],
    ranks: [
      { label: "Bronze", ordinal: 0 },
      { label: "Silver", ordinal: 1 },
      { label: "Gold", ordinal: 2 },
      { label: "Platinum", ordinal: 3 },
      { label: "Diamond", ordinal: 4 },
      { label: "Grandmaster", ordinal: 5 },
      { label: "Celestial", ordinal: 6 },
      { label: "Eternity", ordinal: 7 },
      { label: "One Above All", ordinal: 8 },
    ],
    maxPlayers: 6,
  },
];

export function getGame(id: GameTag): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGameColor(id: GameTag): string {
  return getGame(id)?.color ?? "#00ffa3";
}
