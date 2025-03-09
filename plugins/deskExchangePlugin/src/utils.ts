import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from '@virtuals-protocol/game'

import { FMT_ERRORS } from './constants'

export function errorHandler(f: FMT_ERRORS, e: unknown, logger: (msg: string) => void) {
  let errorMessage: string
  // build message
  if (e instanceof Error) {
    errorMessage = f.replace('{{error}}', e.message)
  } else {
    errorMessage = FMT_ERRORS.SOMETHING_WENT_WRONG.replace('{{error}}', JSON.stringify(e, null, 2))
  }
  // log
  logger(errorMessage)
  // return error response
  return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, errorMessage)
}

export const formatNumber = (num: string | number, decimalPlaces?: number): string => {
  return Number(num).toLocaleString(undefined, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces || 8,
  })
}
