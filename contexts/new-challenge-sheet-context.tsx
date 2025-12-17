import { createContext, ReactNode, useContext, useRef, useCallback } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export interface NewChallengeSheetContextType {
  sheetRef: React.RefObject<BottomSheetModal>;
  openSheet: () => void;
  closeSheet: () => void;
}

export const NewChallengeSheetContext = createContext<NewChallengeSheetContextType>({
  sheetRef: { current: null },
  openSheet: () => {},
  closeSheet: () => {},
});

export const NewChallengeSheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const sheetRef = useRef<BottomSheetModal>(null);

  const openSheet = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  return (
    <NewChallengeSheetContext.Provider value={{ sheetRef, openSheet, closeSheet }}>
      {children}
    </NewChallengeSheetContext.Provider>
  );
};

export const useNewChallengeSheet = (): NewChallengeSheetContextType => {
  return useContext(NewChallengeSheetContext);
};
