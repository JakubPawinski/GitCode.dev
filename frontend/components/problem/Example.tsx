import Image from 'next/image'

export interface ExampleProps {
  exampleNum: number
  exampleText: string
  images?: string[]
}

export const Example = ({ exampleNum, exampleText, images }: ExampleProps) => {
  return (
    <div
      key={exampleNum}
      className="bg-primary/10 border-accent mb-6 rounded-lg border-l-4 p-5 shadow-md"
    >
      <h3 className="text-primary mb-3 text-xl font-bold">
        Example {exampleNum}
      </h3>
      {images && images.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="border-primary/30 bg-background/50 hover:border-accent/50 relative overflow-hidden rounded-lg border p-2 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Image
                src={image}
                alt={`Example ${exampleNum} - Image ${index + 1}`}
                width={400}
                height={300}
                className="rounded-md object-contain"
                quality={90}
              />
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2 text-base">
        <p>
          <strong className="text-accent/80 font-semibold">Input:</strong>{' '}
          <code className="bg-primary/20 text-foreground/80 rounded-md px-2 py-1">
            {exampleText}
          </code>
        </p>
      </div>
    </div>
  )
}
