import { Lamp } from 'lucide-react'

export interface HintProps {
  hint: string
  hintNumber: number
  isClicked: boolean
}

export const Hint = ({ hint, hintNumber, isClicked }: HintProps) => {
  return (
    <div className="border-accent/30 from-accent/5 to-primary/5 hover:border-accent/50 mb-4 rounded-lg border bg-gradient-to-r p-4 shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`rounded-full p-2 transition-all duration-300 ${isClicked ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}
        >
          <Lamp size={20} className={isClicked ? 'animate-pulse' : ''} />
        </div>
        <div className="text-foreground text-lg font-semibold tracking-wide">
          Hint {hintNumber}
        </div>
      </div>
      {isClicked && (
        <div className="text-foreground/90 bg-background/30 border-accent/50 ml-11 rounded-md border-l-2 p-3 leading-relaxed">
          {hint}
        </div>
      )}
    </div>
  )
}
