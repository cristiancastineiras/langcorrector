import { createHash } from "node:crypto";

export function sha256Hex(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export class ChecksumMismatchError extends Error {
  constructor(
    public readonly fileName: string,
    public readonly expected: string,
    public readonly actual: string,
  ) {
    super(`Checksum inválido para "${fileName}": esperado ${expected}, obtenido ${actual}.`);
    this.name = "ChecksumMismatchError";
  }
}

export function assertChecksum(fileName: string, content: string | Buffer, expected: string): void {
  const actual = sha256Hex(content);
  if (actual !== expected) {
    throw new ChecksumMismatchError(fileName, expected, actual);
  }
}
