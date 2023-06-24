import type { FetcherWithComponents } from "@remix-run/react";
import { NavLink, useTransition } from "@remix-run/react";
import type { Player } from "~/engine/player/entity";

type Props = {
  player: Player;
  fetcher: FetcherWithComponents<any>;
};

function Settings({ fetcher }: { fetcher: FetcherWithComponents<any> }) {
  const transition = useTransition();

  const showSpinner =
    transition?.state === "loading" ||
    transition?.state === "submitting" ||
    fetcher?.state === "loading" ||
    fetcher?.state === "submitting";

  return (
    <img
      width="16"
      height="16"
      alt=""
      className={`h-5 w-5  ${showSpinner && "animate-spin"}`}
      style={{ imageRendering: "pixelated" }}
      src="/assets/ui/settings.png"
    ></img>
  );
}

export default function Navigation({ player, fetcher }: Props) {
  // doesnt work nicely when player types something
  // const one = useKeyPress("1");
  // const two = useKeyPress("2");
  // const three = useKeyPress("3");
  // const four = useKeyPress("4");
  // const five = useKeyPress("5");
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (one) {
  //     navigate("/game/field");
  //   } else if (two) {
  //     navigate("/game/inventory");
  //   } else if (three) {
  //     navigate("/game/chat");
  //   } else if (four) {
  //     navigate("/game/character");
  //   } else if (five) {
  //     navigate("/game/settings");
  //   }
  //   //eslint-disable-next-line
  // }, [one, two, three, four, five]);

  return (
    <div className="mt-1 mb-1 flex min-w-max justify-between pt-1 md:mb-2 md:pt-2 ">
      <div className="tabs flex-nowrap">
        <NavLink
          to="/game/field"
          className={({ isActive }) =>
            `tab tab-lifted ${isActive ? "tab-active" : ""}`
          }
        >
          <img
            alt="field"
            height="16"
            width="16"
            className={`h-6 w-6`}
            src="/assets/ui/field.png"
            style={{ imageRendering: "pixelated" }}
          />
        </NavLink>
        <NavLink
          to="/game/inventory"
          className={({ isActive }) =>
            `tab tab-lifted ${isActive ? "tab-active" : ""}`
          }
        >
          <img
            alt=""
            height="16"
            width="16"
            className={`h-6 w-6`}
            src="/assets/ui/inventory.png"
            style={{ imageRendering: "pixelated" }}
          />
        </NavLink>
        <NavLink
          to="/game/character"
          className={({ isActive }) =>
            `tab tab-lifted ${isActive ? "tab-active" : ""}`
          }
        >
          <img
            alt=""
            height="16"
            width="16"
            className={`h-6 w-6`}
            src="/assets/ui/character.png"
            style={{ imageRendering: "pixelated" }}
          />
        </NavLink>
        <NavLink
          to="/game/chat"
          className={({ isActive }) =>
            `tab tab-lifted ${isActive ? "tab-active" : ""}`
          }
        >
          <img
            alt=""
            height="16"
            width="16"
            className={`h-6 w-6`}
            src="/assets/ui/chat.png"
            style={{ imageRendering: "pixelated" }}
          />
        </NavLink>
      </div>
      <div className="relative ml-1 flex flex-nowrap px-0 pt-1 text-sm xs:px-1">
        <div className="mr-2 flex">
          <img
            width="16"
            height="16"
            alt=""
            className="mr-1 h-5 w-5"
            style={{ imageRendering: "pixelated" }}
            src="/assets/ui/heart.png"
          ></img>
          {player.currentHealth}/{player.health}
        </div>
        <div className="mr-2 flex">
          <img
            width="16"
            height="16"
            alt=""
            className="mr-1 h-5 w-5"
            style={{ imageRendering: "pixelated" }}
            src="/assets/ui/xp.png"
          ></img>
          {player.xp}
        </div>
        <NavLink to="/game/settings/general">
          <Settings fetcher={fetcher} />
        </NavLink>
      </div>
    </div>
  );
}
