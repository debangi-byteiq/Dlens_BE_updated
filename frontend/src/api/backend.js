import { Services } from "../Services/Services";

export const backendApi = {
  getMasterTables: () => Services.GET("/master_table"),
  getProfiling: (tableName) => Services.GET(`/profiling/${tableName}`),
  getKde: (tableName) => Services.GET(`/kde/${tableName}`),
  getShifting: (tableName) => Services.GET(`/shifting/${tableName}`),
  runPipeline: () => Services.POST("/run-script?save=Destination"),
  uploadCsv: (formData) => Services.POST("/newupload", formData),
  saveSource: (payload) => Services.POST("/save_source", payload),
  login: (formData, config) => Services.POST("/auth/login", formData, config),
  forgotPassword: (payload, config) =>
    Services.POST("/auth/forgot-password", payload, config),
  resetPassword: (payload) => Services.PUT("/auth/reset-password", payload),
  registerUser: (payload) => Services.POST("/users/", payload),
  verifyUser: (payload) => Services.POST("/users/verify", payload),
};
