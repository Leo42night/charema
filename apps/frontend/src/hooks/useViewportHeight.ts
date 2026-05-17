import { useEffect } from "react";

export const useViewportHeight = () => {
  // Tambahkan di component (hook untuk visual viewport)
  useEffect(() => {
    const updateVH = () => {
      const vh = (window.visualViewport?.height ?? window.innerHeight) * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    updateVH();
    window.visualViewport?.addEventListener("resize", updateVH);
    window.visualViewport?.addEventListener("scroll", updateVH);
    window.addEventListener("resize", updateVH);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateVH);
      window.visualViewport?.removeEventListener("scroll", updateVH);
      window.removeEventListener("resize", updateVH);
    };
  }, []);
};