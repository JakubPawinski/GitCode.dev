import { useEffect, useState } from 'react'

export const useDebounce = ({ query }: { query: string }) => {
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timerId)
  }, [query])

  return { debouncedQuery }
}
