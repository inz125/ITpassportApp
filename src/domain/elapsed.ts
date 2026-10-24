const pad = (value: number): string => String(value).padStart(2, '0')

// 60分を超えても時間には繰り上げず、「分:秒」のまま表示する
export const formatElapsed = (milliseconds: number): string => {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000)
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
}
