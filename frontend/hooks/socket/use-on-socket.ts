import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
export interface SocketProps {
  rooms: string[]
  socket: Socket
}

export const useOnSocket = ({ rooms, socket }: SocketProps) => {
  const [messages, setMessages] = useState<Record<string, any>>()
  const handlers: { room: string; handler: (payload: any) => void }[] = []
  const roomsStringified = JSON.stringify(rooms)

  useEffect(() => {
    if (!socket) {
      console.warn('Socket is not available')
      return
    }
    console.log('Setting up socket listeners for rooms:', rooms)

    rooms.forEach((room: string) => {
      const handleEvent = (payload: any) => {
        console.log(`[Socket event] Received event in room ${room}:`, payload)
        if (socket.active && payload) {
          setMessages((previous) => ({
            ...previous,
            [room]: payload,
          }))
        } else {
          console.warn(
            `Socket is not active or payload is invalid for room ${room}`
          )
        }
      }
      console.log(`Subscribing to room: ${room}`)
      socket.on(room, handleEvent)
      handlers.push({ room, handler: handleEvent })
    })

    return () => {
      handlers.forEach(({ room, handler }) => {
        console.log(`Unsubscribing from room: ${room}`)
        socket.off(room, handler)
      })
    }
  }, [roomsStringified, socket])

  return { messages }
}
