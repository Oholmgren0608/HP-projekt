import { useSyncExternalStore } from "react";

// Stable no-op subscription: the hydration state never changes after mount,
// so there is nothing to subscribe to.
function subscribe() {
  return () => {};
}

/**
 * Returns `false` during server rendering and the initial client render, then
 * `true` once the component has hydrated on the client.
 *
 * This is the canonical, lint-clean replacement for the
 * `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])`
 * pattern: `useSyncExternalStore` reads a different snapshot on the server
 * (`getServerSnapshot`) than on the client (`getSnapshot`) without calling
 * `setState` inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
