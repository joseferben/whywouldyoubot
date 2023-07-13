export type Props = {
  head: number | undefined | null;
  eyes: number | undefined | null;
  hair: number | undefined | null;
};

export function PlayerImage(props: Props) {
  return (
    <div className="relative z-50 h-full w-full">
      <img
        className="absolute z-30 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="16"
        width="16"
        src={`/assets/avatars/hair_${props.hair || 0}.png`}
      />
      <img
        className="absolute z-20 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="16"
        width="16"
        src={`/assets/avatars/eyes_${props.eyes || 0}.png`}
      />
      <img
        className="absolute z-10 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="16"
        width="16"
        src={`/assets/avatars/head_${props.head || 0}.png`}
      />
    </div>
  );
}
