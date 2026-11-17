import { Route, Routes } from 'react-router';

import { House } from './components/House/House.tsx';

/**
 * All house URLs ("/", "/kitchen", "/kitchen/stuffed-peppers", unknown paths)
 * render the same House so room changes can animate between rooms.
 * M4 adds "/tour" above the catch-all.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<House />} />
    </Routes>
  );
}
