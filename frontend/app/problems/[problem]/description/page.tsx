'use client'
import { Description, DescriptionProps } from '@/components/problem/Description'
import { ProblemContext } from '@/contexts/ProblemContext'
import { useContext } from 'react'

export default function DescriptionPage() {
  const problemData = useContext(ProblemContext) as DescriptionProps
  return <Description {...problemData} />
}
