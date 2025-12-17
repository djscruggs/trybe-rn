import { createContext, ReactNode, useContext, useRef, useCallback, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export type AuthMode = 'sign-up' | 'sign-in';

export interface AuthSheetContextType {
  sheetRef: React.RefObject<BottomSheetModal>;
  mode: AuthMode;
  openSignUp: () => void;
  openSignIn: () => void;
  switchToSignUp: () => void;
  switchToSignIn: () => void;
  closeSheet: () => void;
}

export const AuthSheetContext = createContext<AuthSheetContextType>({
  sheetRef: { current: null },
  mode: 'sign-up',
  openSignUp: () => {},
  openSignIn: () => {},
  switchToSignUp: () => {},
  switchToSignIn: () => {},
  closeSheet: () => {},
});

export const AuthSheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [mode, setMode] = useState<AuthMode>('sign-up');

  const openSignUp = useCallback(() => {
    setMode('sign-up');
    sheetRef.current?.present();
  }, []);

  const openSignIn = useCallback(() => {
    setMode('sign-in');
    sheetRef.current?.present();
  }, []);

  const switchToSignUp = useCallback(() => {
    setMode('sign-up');
  }, []);

  const switchToSignIn = useCallback(() => {
    setMode('sign-in');
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  return (
    <AuthSheetContext.Provider
      value={{ sheetRef, mode, openSignUp, openSignIn, switchToSignUp, switchToSignIn, closeSheet }}>
      {children}
    </AuthSheetContext.Provider>
  );
};

export const useAuthSheet = (): AuthSheetContextType => {
  return useContext(AuthSheetContext);
};
