export function Avatar() {
  return (
    <div className="absolute z-50 h-full w-full">
      <img
        className="absolute z-30 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="96"
        width="96"
        src={`/assets/avatars/hair_0.png`}
      />
      <img
        className="absolute z-20 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="96"
        width="96"
        src={`/assets/avatars/eyes_0.png`}
      />
      <img
        className="absolute z-10 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="96"
        width="96"
        src={`/assets/avatars/head_0.png`}
      />
    </div>
  );
}
