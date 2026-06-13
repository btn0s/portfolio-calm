export function formatDate(date: string, includeRelative = false) {
  const currentDate = new Date()
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  const targetDate = new Date(date)

  const monthDelta =
    (currentDate.getFullYear() - targetDate.getFullYear()) * 12 +
    (currentDate.getMonth() - targetDate.getMonth())
  const days = Math.floor(
    (currentDate.getTime() - targetDate.getTime()) / 86_400_000
  )

  let formattedDate = ''

  if (monthDelta >= 12) {
    formattedDate = `${Math.floor(monthDelta / 12)}y ago`
  } else if (monthDelta >= 1 && !(monthDelta === 1 && currentDate.getDate() < targetDate.getDate())) {
    formattedDate = `${monthDelta}mo ago`
  } else if (days > 0) {
    formattedDate = `${days}d ago`
  } else {
    formattedDate = 'Today'
  }

  const fullDate = targetDate.toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}
