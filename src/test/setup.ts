class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>()

  get length() {
    return this.items.size
  }

  clear() {
    this.items.clear()
  }

  getItem(key: string) {
    return this.items.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.items.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.items.delete(key)
  }

  setItem(key: string, value: string) {
    this.items.set(key, String(value))
  }
}

// Node 25 expone un localStorage experimental que, sin --localstorage-file, no tiene los métodos
// de Storage y pisa el de jsdom. Se reemplaza solo en ese caso para que los tests puedan usarlo.
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
    writable: true,
  })
}
