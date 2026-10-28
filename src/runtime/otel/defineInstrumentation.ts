import type { ModuleOptions } from './types'

export function defineInstrumentation(setup: (options: ModuleOptions) => void): (options: ModuleOptions) => void {
  return setup
}
