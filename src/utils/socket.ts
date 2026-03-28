/* eslint-disable @typescript-eslint/no-unused-vars */
import { io } from "socket.io-client";

export const socket = io(`${import.meta.env.VITE_BACKEND_URI}`, {
  transports: ["websocket"],
});
