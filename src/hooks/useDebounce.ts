import { useEffect, useState } from 'react';

// Returns the value only after it stopped changing for `delay` ms.
// Used so the search does not hit the API on every keystroke.
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
