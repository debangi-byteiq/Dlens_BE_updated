import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pollingActive: false,
  progress: 0,
};

const progessSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    togglePolling: (state, action) => {
      state.pollingActive = action.payload;
    },
    manageProgress: (state, action) => {
      state.progress = action.payload;
    },
  },
});

// Function to save state to localStorage

export const { togglePolling, manageProgress } = progessSlice.actions;

export default progessSlice.reducer;
