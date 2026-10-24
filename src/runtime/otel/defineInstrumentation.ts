import type { ModuleOptions } from '../../module.ts'

export function defineInstrumentation(setup: (options: ModuleOptions) => void): (options: ModuleOptions) => void {
  return setup
}
