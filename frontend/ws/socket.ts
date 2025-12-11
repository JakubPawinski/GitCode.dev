import { io } from 'socket.io-client'

const wsUrl = 'http://localhost:4002/submissions'

export const socket = io(wsUrl, {
  reconnection: true,
  reconnectionDelay: 5000,
  timeout: 20000,
})
