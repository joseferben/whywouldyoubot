import type { Avatar as AvatarType } from "~/engine/avatar/service.server";

export function Avatar({ avatar }: { avatar: AvatarType }) {
  return (
    <div className="h-full w-full">
      <img
        className="absolute z-30 h-full w-full"
        alt="eyes"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
        }}
        height="96"
        width="96"
        src={`/assets/avatars/hair_${avatar.hair}.png`}
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
        src={`/assets/avatars/eyes_${avatar.eyes}.png`}
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
        src={`/assets/avatars/head_${avatar.head}.png`}
      />
    </div>
  );
}
