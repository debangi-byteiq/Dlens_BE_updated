import { configureStore } from "@reduxjs/toolkit";
import connectionReducer from "./Features/ConnectionSlice";
import progessSilce from "./Features/progessSilce";

const store = configureStore({
  reducer: {
    connection: connectionReducer,
    progress: progessSilce,
  },
});

export default store;
