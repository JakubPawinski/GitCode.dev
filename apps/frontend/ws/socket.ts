import { io } from 'socket.io-client'

const testUrl = 'http://localhost:8080/submissions'
export const socket = io(testUrl, {
  path: '/api/ws/submissions/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 5000,
  timeout: 20000,
  withCredentials: true,
  transports: ['websocket', 'polling'],
})
