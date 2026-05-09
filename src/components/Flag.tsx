import { getFlagCode, getTeamFlag } from '../data/teams'

interface FlagProps {
  team: string | null | undefined
  size?: number
}

export function Flag({ team, size = 32 }: FlagProps) {
  const code = getFlagCode(team)

  if (!code) {
    return <span style={{ fontSize: size, lineHeight: 1 }}>{getTeamFlag(team)}</span>
  }

  return (
    <span
      className={`fi fi-${code}`}
      style={{ fontSize: size, lineHeight: 1, verticalAlign: 'middle' }}
    />
  )
}
