export interface ConstraintProps {
  constraint: string
  key?: number
}
export const Constraint = ({ constraint, key }: ConstraintProps) => {
  return (
    <li key={key} className="text-foreground/90">
      {constraint}
    </li>
  )
}
