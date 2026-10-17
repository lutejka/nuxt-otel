import type { ModuleOptions } from '~/src/module'

export function defineInstrumentation(setup: (options: ModuleOptions) => void): (options: ModuleOptions) => void {
  return setup
}
