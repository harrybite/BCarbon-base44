import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    // Set initial value
    setIsMobile(mql.matches);

    // Listen to screen width changes
    mql.addEventListener("change", handleChange);

    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  return isMobile;
}
