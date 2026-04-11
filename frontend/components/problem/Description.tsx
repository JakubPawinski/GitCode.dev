'use client'
import { Example, ExampleProps } from './Example'
import { Constraint } from './Constraint'
import { Hint, HintProps } from './Hint'
import { Topic } from './Topic'
import { useMemo } from 'react'

export interface DescriptionProps {
  problemId: string
  title: string
  description: string
  examples: ExampleProps[]
  constraints: string[]
  topics: string[]
  hints: HintProps[]
}

export const Description = ({
  problemId,
  title,
  description,
  examples,
  constraints,
  topics,
  hints,
}: DescriptionProps) => {
  const croppedDescription = useMemo(
    () => description.slice(0, description.lastIndexOf('.')),
    [description]
  )
  return (
    <div className="border-primary/20 rounded-xl border bg-transparent p-6 shadow-2xl backdrop-blur-sm">
      <header className="border-primary/30 mb-6 border-b pb-4">
        <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
          {problemId}. {title}
        </h1>
      </header>
      <section className="mb-8">
        <div className="bg-primary/5 border-primary/20 rounded-lg border p-5 shadow-md">
          <h2 className="text-primary mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="bg-primary/20 rounded-full px-3 py-1 text-sm">
              Description
            </span>
          </h2>
          <p className="text-foreground text-base leading-relaxed">
            {croppedDescription}.
          </p>
        </div>
      </section>
      <section>
        <h2 className="text-accent mb-4 text-xl font-semibold tracking-wide">
          Examples
        </h2>
        {examples?.map((example, index) => (
          <Example key={`${example.exampleNum}-${index}`} {...example} />
        ))}
      </section>
      <div className="border-primary/30 mt-8 border-t pt-6">
        <h2 className="text-accent mb-4 text-xl font-semibold tracking-wide">
          Constraints
        </h2>
        <ul className="list-inside list-disc space-y-2 text-base">
          {constraints?.map((constraint, index) => (
            <Constraint
              key={`${constraint}-${index}`}
              constraint={constraint}
            />
          ))}
        </ul>
      </div>
      <footer className="my-4">
        <div>
          {hints.map((hint, index) => (
            <Hint key={`${hint}-${index}`} {...hint} />
          ))}
        </div>
        <div>
          {topics.map((topic, index) => (
            <Topic key={`${topic}-${index}`} topic={topic} />
          ))}
        </div>
      </footer>
    </div>
  )
}
