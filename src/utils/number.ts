// vyresene zaokrouhlovani cisel -> zaokrouhlim cislo vzdycky dolu na nejblizsi 0.5

export function roundDownToHalf(value: number): number {
  const safeValue = Number.isFinite(value) ? value : 0
  return Math.floor((safeValue + Number.EPSILON) * 2) / 2
}

export function formatHalfStep(value: number): string {
  const rounded = roundDownToHalf(value)

  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString('cs-CZ')
  }

  return rounded.toLocaleString('cs-CZ', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })
}
