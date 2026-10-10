export function qs<T extends Element = Element>(selector: string, parent: ParentNode = document): T {
  const el = parent.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Elemen tidak ditemukan untuk selector: ${selector}`);
  }
  return el;
}

export function qsa<T extends Element = Element>(selector: string, parent: ParentNode = document): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}
