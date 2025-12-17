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
      return
    }
    rooms.forEach((room: string) => {
      const handleEvent = (payload: any) => {
        if (socket.active && payload) {
          setMessages((previous) => ({
            ...previous,
            [room]: payload,
          }))
        }
      }

      socket.on(room, handleEvent)
      handlers.push({ room, handler: handleEvent })
    })

    return () => {
      handlers.forEach(({ room, handler }) => {
        socket.off(room, handler)
      })
    }
  }, [roomsStringified, socket])

  return { messages }
}
