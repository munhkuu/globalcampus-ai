export interface ValidationResult {
  valid: boolean
  reason?: string
}

export function validateExplainerInput(input: string): ValidationResult {
  const trimmed = input.trim()
  if (trimmed.length < 10)
    return { valid: false, reason: 'Input is too short — paste a lecture excerpt or question.' }
  if (trimmed.length > 3000)
    return { valid: false, reason: 'Input exceeds 3000 characters. Please shorten it.' }
  return { valid: true }
}

export function validateRoadmapInput(input: {
  targetRole: string
  timelineMonths: number
}): ValidationResult {
  if (!input.targetRole || input.targetRole.trim().length < 2)
    return { valid: false, reason: 'Please enter a target role.' }
  if (input.targetRole.length > 100)
    return { valid: false, reason: 'Target role must be under 100 characters.' }
  if (input.timelineMonths < 1 || input.timelineMonths > 24)
    return { valid: false, reason: 'Timeline must be between 1 and 24 months.' }
  return { valid: true }
}
