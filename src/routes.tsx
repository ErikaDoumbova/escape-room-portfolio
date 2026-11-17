import { Navigate, Route, Routes, useParams } from 'react-router';

import { HelloHouse } from './components/HelloHouse/HelloHouse.tsx';
import { liveRoomIds } from './content/site.ts';

/** `/:room` and `/:room/:object`. Unknown rooms go back to the front door. */
function RoomRoute() {
  const { room } = useParams();
  if (!room || !liveRoomIds.includes(room)) return <Navigate to="/" replace />;
  return <HelloHouse />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<HelloHouse />} />
      <Route path=":room/:object?" element={<RoomRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
