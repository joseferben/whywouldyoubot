import { Link } from "@remix-run/react";
import imageDaggerRust from "../../../public/assets/items/dagger_rust.png";
import imageHoney from "../../../public/assets/items/honey.png";

function Honey() {
  return (
    <li className="flex border-b border-px">
      <img
        style={{ imageRendering: "pixelated" }}
        height="38"
        width="38"
        src={imageHoney}
      />
      <a className="pt-2" href="">
        Honey x32
      </a>
      <div className="pt-1 ml-auto pr-2">
        <Link className="ml-2 btn btn-primary btn-xs" to="/game">
          Eat
        </Link>
      </div>
    </li>
  );
}

function DaggerRust() {
  return (
    <li className="flex border-b border-px">
      <img
        style={{ imageRendering: "pixelated" }}
        height="38"
        width="38"
        src={imageDaggerRust}
      />
      <a className="pt-2" href="">
        Rust dagger x2
      </a>
      <div className="pt-1 ml-auto pr-2">
        <Link className="ml-2 btn btn-primary btn-xs" to="/game">
          Equip
        </Link>
      </div>
    </li>
  );
}

export default function Inventory() {
  return (
    <ul className="text-sm">
      <Honey />
      <DaggerRust />
    </ul>
  );
}
