export const decodedData = async ({ data }: { data: any }) => {
  if (!data) return
  let result = ''
  const trailingErrorSuffix = '[Error: list index out of range]'

  const reader = data.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)

    for (let line of lines) {
      const parsed = JSON.parse(line.replace(/^data:\s*/, ''))
      if (parsed.text) {
        result += parsed.text
      }
    }
  }
  return result.endsWith(trailingErrorSuffix)
    ? result.slice(0, -trailingErrorSuffix.length)
    : result
}
