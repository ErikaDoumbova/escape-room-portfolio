import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';

import { ToastProvider } from './components/Toast/ToastProvider.tsx';
import { AppRoutes } from './routes.tsx';

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
