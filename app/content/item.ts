import bonesImage from "../../public/assets/items/bones.png";
import goldImage from "../../public/assets/items/gold.png";
import honeyImage from "../../public/assets/items/honey.png";

export type Item = {
  name: string;
  image: string;
};

export const gold = {
  name: "gold",
  image: goldImage,
};

export const honey = {
  name: "honey",
  image: honeyImage,
};

export const bones = {
  name: "bones",
  image: bonesImage,
};
