import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';

import { ToastProvider } from './components/Toast/ToastProvider.tsx';
import { AppRoutes } from './routes.tsx';
import { StateProviders } from './state/StateProviders.tsx';

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <StateProviders>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </StateProviders>
      </MotionConfig>
    </LazyMotion>
  );
}
