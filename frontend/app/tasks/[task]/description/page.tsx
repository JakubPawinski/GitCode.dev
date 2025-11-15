'use client'
import { Description } from '@/components/description/Description'
import { use } from 'react'

export interface ParamsProps {
  task: string
}

export default function DescriptionPage({
  params,
}: {
  params: Promise<ParamsProps>
}) {
  const { task } = use(params)
  return <Description title={task} />
}
