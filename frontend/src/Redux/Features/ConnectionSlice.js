import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sourceImages: [],
  sourceTexts: [],
  destinationImages: [],
  destinationTexts: [],
  date: new Date(),
  sourceId: null,
  processResponse: [],
  progress: 0,
  status: "uploading",
};

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    updateDate: (state, action) => {
      state.date = new Date(action.payload);
    },
    addSourceImage: (state, action) => {
      state.sourceImages.push(action.payload.image);
      state.sourceTexts.push(action.payload.text);
    },
    addDestinationImage: (state, action) => {
      state.destinationImages.push(action.payload.image);
      state.destinationTexts.push(action.payload.text);
    },
    deleteSourceImage: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.sourceImages.length) {
        state.sourceImages.splice(index, 1);
        state.sourceTexts.splice(index, 1);
      }
    },
    deleteDestinationImage: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.destinationImages.length) {
        state.destinationImages.splice(index, 1);
        state.destinationTexts.splice(index, 1);
      }
    },
    deleteConnection: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.sourceImages.length) {
        state.sourceImages.splice(index, 1);
        state.sourceTexts.splice(index, 1);
        state.destinationImages.splice(index, 1);
        state.destinationTexts.splice(index, 1);
      }
    },
    setSourceId: (state, action) => {
      state.sourceId = action.payload;
    },
    clearImages: (state) => {
      state.sourceImages = [];
      state.sourceTexts = [];
      state.destinationImages = [];
      state.destinationTexts = [];
    },
    // setProcessResponse: (state, action) => {
    //   state.processResponse = action.payload;
    // },
    // addProcessResponse: (state, action) => {
    //   state.processResponse.push(action.payload);
    // },
    startUpload: (state) => {
      state.status = "uploading";
      state.progress = 0;
      saveToLocalStorage(state);
    },
    updateProgress: (state, action) => {
      state.progress = action.payload;
      saveToLocalStorage(state);
    },
    uploadSuccess: (state) => {
      state.status = "success";
      state.progress = 100;
      saveToLocalStorage(state);
    },
    uploadError: (state) => {
      state.status = "error";
      saveToLocalStorage(state);
    },
    removeProcessResponseAtIndex: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.processResponse.length) {
        if (state.processResponse[index] === "success") {
          state.processResponse.splice(index, 1);
        }
      }
    },
  },
});

// Function to save state to localStorage
const saveToLocalStorage = (state) => {
  localStorage.setItem("uploadState", JSON.stringify(state));
};
export const {
  updateDate,
  addSourceImage,
  addDestinationImage,
  deleteSourceImage,
  deleteDestinationImage,
  deleteConnection,
  clearImages,
  setSourceId,
  setProcessResponse,
  addProcessResponse,
  removeProcessResponseAtIndex,
  startUpload,
  updateProgress,
  uploadSuccess,
  uploadError,
} = connectionSlice.actions;

export default connectionSlice.reducer;
