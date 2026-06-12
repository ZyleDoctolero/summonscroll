import { useEffect, useState } from "react";

const MOBILE_BP = 768;

export function useIsMobile() {
  const [mobile, setMobile] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.innerWidth < MOBILE_BP
  );
  
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  
  return mobile;
}