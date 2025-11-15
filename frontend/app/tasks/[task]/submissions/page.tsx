'use client'
import { TaskSubmissions } from '@/components/submission/TaskSubmissions'
import { ParamsProps } from '../description/page'
import { use } from 'react'

export default function SubmissionsPage({
  params,
}: {
  params: Promise<ParamsProps>
}) {
  const { task } = use(params)
  return <TaskSubmissions title={task} />
}
