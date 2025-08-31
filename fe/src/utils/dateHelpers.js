export function startOfWeek(date){
  const d = new Date(date)
  const day = (d.getDay()+6)%7 // Th2=0
  d.setDate(d.getDate()-day)
  d.setHours(0,0,0,0)
  return d
}
export function addWeeks(date, n){
  const d = new Date(date)
  d.setDate(d.getDate()+n*7)
  return d
}
export function getWeekDays(weekStart){
  const days = []
  for(let i=0;i<7;i++){
    const d = new Date(weekStart)
    d.setDate(d.getDate()+i)
    days.push(d)
  }
  return days
}
export function isSameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
export function formatHeader(date){
  const thuVN = ['T2','T3','T4','T5','T6','T7','CN']
  const idx = (date.getDay()+6)%7
  const day = thuVN[idx]
  const dateText = `${date.getDate()} Th${date.getMonth()+1}`
  return { day, dateText }
}
export function formatMonthTitle(date){
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return `Tháng ${m} Năm ${y}`
}
export function toISODate(d){
   const x = new Date(d); x.setHours(0,0,0,0);
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${da}`
}
export function addDays(date, n){
  const d = new Date(date)
  d.setDate(d.getDate()+n)
  return d
}