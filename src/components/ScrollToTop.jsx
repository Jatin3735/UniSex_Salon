import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * The router keeps the scroll position across navigations, which made the
 * multi-step booking flow open halfway down the next page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
