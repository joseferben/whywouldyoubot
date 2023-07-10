type PlayerStepped = {
  tag: "playerStepped";
  playerId: string;
  x: number;
  y: number;
  lastStep?: boolean;
};

type PlayerAttacked = {
  tag: "playerAttacked";
  characterId: string;
};

export type ServerEvent = PlayerStepped | PlayerAttacked;
