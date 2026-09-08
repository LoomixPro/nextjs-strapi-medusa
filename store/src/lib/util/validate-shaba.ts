export function validateShaba(shaba: string): boolean {
  if (!shaba) return false
  let fullShaba = shaba
  if (fullShaba.length === 24) {
    fullShaba = "IR" + fullShaba
  }

  if (fullShaba.length !== 26 || !fullShaba.startsWith("IR")) return false

  const rearranged = fullShaba.substring(4) + fullShaba.substring(0, 4)
  const numericString = rearranged.replace("IR", "1827")

  try {
    return BigInt(numericString) % BigInt(97) === BigInt(1)
  } catch {
    return false
  }
}
