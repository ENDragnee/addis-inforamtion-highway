"use client";

import { useState, useEffect } from 'react';

/**
 * A custom hook to check if a CSS media query matches.
 * @param query The media query string (e.g., "(min-width: 768px)").
 * @returns {boolean} True if the query matches, false otherwise.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};
