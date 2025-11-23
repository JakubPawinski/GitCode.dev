import { Example, ExampleProps } from './Example'
import { Constraint, ConstraintProps } from './Constraint'
import { Hint, HintProps } from './Hint'
import { Topic, TopicProps } from './Topic'

export interface DescriptionProps {
  problemId: number
  title: string
  description: string
  examples: ExampleProps[]
  constraints: ConstraintProps[]
  topics: TopicProps[]
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
  return (
    <div className="border-primary/20 rounded-xl border bg-transparent p-6 shadow-2xl backdrop-blur-sm">
      <header className="border-primary/30 mb-6 border-b pb-4">
        <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
          {problemId}. {title}
        </h1>
      </header>
      <section className="mb-8">
        <p className="text-foreground/90 text-base leading-relaxed">
          {description}
        </p>
      </section>
      <section>
        <h2 className="text-accent mb-4 text-xl font-semibold tracking-wide">
          Examples
        </h2>
        {examples?.map((example) => (
          <Example {...example} />
        ))}
      </section>
      <div className="border-primary/30 mt-8 border-t pt-6">
        <h2 className="text-accent mb-4 text-xl font-semibold tracking-wide">
          Constraints
        </h2>
        <ul className="list-inside list-disc space-y-2 text-base">
          {constraints?.map((constraint) => (
            <Constraint {...constraint} />
          ))}
        </ul>
      </div>
      <footer>
        <div>
          {hints?.map((hint) => (
            <Hint {...hint} />
          ))}
        </div>
        <div>
          {topics?.map((topic) => (
            <Topic {...topic} />
          ))}
        </div>
      </footer>
    </div>
  )
}
