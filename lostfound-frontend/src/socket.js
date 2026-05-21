import { io } from "socket.io-client";

const URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace("/api", "");

// autoConnect: true — app ачаалмагц шууд холбогдоно
const socket = io(URL, {
  autoConnect:       true,
  reconnection:      true,
  reconnectionDelay: 2000,
  transports:        ["websocket", "polling"],
});

export default socket;
