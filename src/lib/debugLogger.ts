export class DebugLogger {
  private static enabled = import.meta.env.DEV

  static log(category: string, message: string, data?: unknown) {
    if (!this.enabled) return
    
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${category}]`
    
    if (data) {
      console.log(`${prefix} ${message}`, data)
    } else {
      console.log(`${prefix} ${message}`)
    }
  }

  static error(category: string, message: string, error?: unknown) {
    if (!this.enabled) return
    
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${category}] ERROR`
    
    console.error(`${prefix} ${message}`, error)
  }

  static warn(category: string, message: string, data?: unknown) {
    if (!this.enabled) return
    
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${category}] WARN`
    
    if (data) {
      console.warn(`${prefix} ${message}`, data)
    } else {
      console.warn(`${prefix} ${message}`)
    }
  }

  static group(name: string) {
    if (!this.enabled) return
    console.group(name)
  }

  static groupEnd() {
    if (!this.enabled) return
    console.groupEnd()
  }
}