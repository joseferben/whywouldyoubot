import { useRef, useEffect } from "react";

export function useOutsideClick(
  callback: () => void
): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  // @ts-ignore
  return ref;
}
