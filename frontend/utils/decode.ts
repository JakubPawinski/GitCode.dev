export const decodedData = async ({ data }: { data: any }) => {
  const reader = data.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const buffer = decoder.decode(value, { stream: true })
    return buffer
  }
}
