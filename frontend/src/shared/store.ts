import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    // Add feature slices here
    // auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
