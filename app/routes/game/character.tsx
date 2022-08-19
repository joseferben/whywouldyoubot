import imageAmulet from "../../../public/assets/items/crystal.png";
import imageWeapon from "../../../public/assets/items/dagger_iron.png";

type Equipment = {
  img: string;
  effect: number;
  effectName: string;
};

function Slot({
  name,
  equipment,
}: {
  name: string;
  equipment: Equipment | null;
}) {
  if (equipment !== null) {
    const { img, effect, effectName } = equipment;
    return (
      <li className="text-center">
        <span className="font-bold">{name}</span>
        <div className="mt-2 card bg-neutral">
          <img
            className="mx-auto"
            style={{ imageRendering: "pixelated" }}
            height="38"
            width="38"
            src={img}
          />
        </div>
        <span className="text-sm">
          +{effect} {effectName}
        </span>
      </li>
    );
  } else {
    return (
      <li className="text-center">
        <span className="font-bold">{name}</span>
        <div className="mt-2 p-3 card bg-neutral">
          <span className="mx-auto">Empty</span>
        </div>
      </li>
    );
  }
}

function Equipment() {
  const slot1: Equipment = {
    img: imageWeapon,
    effect: 3,
    effectName: "Attack",
  };
  const slot2: Equipment = {
    img: imageAmulet,
    effect: 5,
    effectName: "Intelligence",
  };

  return (
    <ul className="flex flex-row justify-between">
      <Slot name="Weapon" equipment={slot1} />
      <Slot name="Amulet" equipment={slot2} />
      <Slot name="Shield" equipment={null} />
    </ul>
  );
}

function SkillRowCombat() {
  return (
    <ul className="px-2">
      <li className="border-b border-px flex justify-between">
        <span>🗡️ Attack</span>
        <span>6 (+3)</span>
      </li>
      <li className="border-b border-px flex justify-between">
        <span>📜 Intelligence</span>
        <span>6 (+5)</span>
      </li>
      <li className="border-b border-px flex justify-between">
        <span>🛡️ Defense</span>
        <span>1</span>
      </li>
      <li className="border-b border-px flex justify-between">
        <span>👊 Combat</span>
        <span>= 13</span>
      </li>
    </ul>
  );
}

function SkillRowOther() {
  return (
    <ul className="px-2">
      <li className="border-b border-px flex justify-between">
        <span>🎣 Fishing</span>
        <span>1</span>
      </li>
      <li className="border-b border-px flex justify-between">
        <span>🪵 Woodcutting</span>
        <span>2</span>
      </li>
      <li className="border-b border-px flex justify-between">
        <span>🍳 Cooking</span>
        <span>4</span>
      </li>
    </ul>
  );
}

function Skills() {
  return (
    <div className="flex flex-row">
      <div className="w-1/2">
        <SkillRowCombat />
      </div>
      <div className="w-1/2">
        <SkillRowOther />
      </div>
    </div>
  );
}

export default function Character() {
  return (
    <div>
      <div className="mb-5">
        <Equipment />
      </div>
      <h2 className="font-bold">Skills</h2>
      <Skills />
    </div>
  );
}
