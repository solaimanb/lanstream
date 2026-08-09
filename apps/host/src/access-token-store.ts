import { createHash, timingSafeEqual } from "node:crypto";

/** In-memory active guest-token hashes synchronized by portal heartbeats. */
export class AccessTokenStore {
  private hashes: Buffer[] = [];

  replace(hashes: string[]): void {
    this.hashes = hashes
      .filter((hash) => /^[a-f0-9]{64}$/i.test(hash))
      .map((hash) => Buffer.from(hash, "hex"));
  }

  validate(rawToken: string): boolean {
    const candidate = createHash("sha256").update(rawToken).digest();
    let valid = false;
    for (const hash of this.hashes) {
      valid = timingSafeEqual(candidate, hash) || valid;
    }
    return valid;
  }
}
