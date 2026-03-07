# Proof Bundles (Cryptographic Verification)

Downloadable, offline-verifiable verification records for every Provenance badge.

This upgrades the trust model from "trust Provenance's servers" to "verify the badge with math", without changing the core UX of the product.

---

## Why This Feature

### It makes the badge meaningfully stronger

The MVP trust model is hosted (verifiers trust Provenance to have recorded and presented the audit trail honestly). Proof Bundles add an optional, cryptographic layer:

- The verification page can still be trusted "like GitHub history"
- But a verifier can also download the record and independently validate integrity and authenticity

This is an immediate credibility amplifier for the target audience (technical/craft bloggers) and for skeptical readers.

### It creates a portable artifact

Writers can:

- Commit the bundle to a repo
- Mirror it to their own storage
- Attach it to a newsletter issue / PDF / archive

Readers can:

- Verify later (offline)
- Verify even if Provenance disappears

### It unlocks third-party tooling

A stable proof format enables:

- CI checks ("fail if badge proof doesn't verify")
- Browser extensions ("verify this badge in-page")
- Community verifiers and alternative UIs

---

## What It Is (Concept)

When a writer generates a badge, Provenance creates a canonical "snapshot record" of the badge's public data:

- Document snapshot (text + structured content)
- Audit trail (AI interactions, paste events, revisions, sessions)
- Stats (AI %, pasted %, sessions, time, etc.)
- Metadata (badge id, verification id, created_at, app version)

Provenance then:

1. Computes cryptographic hashes over the record (including an event hash-chain for the audit trail)
2. Signs the result with a server-held signing key (Ed25519)
3. Stores the proof bundle (or stores just the hashes + signature and re-derives the bundle on demand)

The proof bundle is downloadable from the public verification page.

---

## User Experience

### Verification Page

- Add a "Download proof" button with a short explanation:
  - "Contains the full public record for this badge, hashed and signed by Provenance. Verifiable offline."
- Show a compact "Proof fingerprint" (first/last 6 chars of the root hash) with a copy button

### Writer Flow (Badge Generation)

- Keep the current badge preview and confirmation gate
- Optionally show: "This badge includes a downloadable signed proof record"

---

## Bundle Format (v1 Proposal)

Deliver as a single JSON file or a zip with a JSON payload plus optional helper files.

### `proof.json` (single-file JSON)

Top-level shape:

- `version`: string, e.g. `"proof-bundle/v1"`
- `createdAt`: ISO timestamp
- `app`: `{ name: "provenance", build?: string }`
- `badge`: `{ id, verificationId, createdAt, isTakenDown }`
- `snapshot`: `{ documentTitle, documentText, documentContent }`
- `auditTrail`: public audit events (exactly what the verification page shows)
- `stats`: public stats JSON
- `hashes`:
  - `canonicalization`: `"json-canonicalization-scheme/v1"` (explicitly defined)
  - `root`: hex/base64url hash of the canonical record
  - `auditTrailChain`: array of per-event hashes with previous pointer (optional but recommended)
- `signature`:
  - `alg`: `"Ed25519"`
  - `keyId`: stable key identifier
  - `sig`: base64url signature over `hashes.root` (or over a canonical signed payload)
- `publicKey` (optional):
  - If included, must be pinned to `keyId`
  - Alternative: publish keys at a stable URL and embed that URL in the bundle

### Canonicalization (Non-Negotiable)

JSON must be canonicalized before hashing/signing. Otherwise, equivalent JSON encodings break verification.

Rules to define and freeze in `v1`:

- UTF-8 encoding
- Deterministic key ordering
- No insignificant whitespace
- Defined number formatting
- Stable representation for dates/UUIDs

---

## Cryptographic Model

### Root Hash

- `root = SHA-256(canonical(record_without_signature_fields))`
- Signature covers `root` (and ideally also `version` and `keyId` to prevent substitution attacks)

### Audit Trail Hash-Chain (Optional v1, likely required v2)

Hash each event with a previous pointer to make the order tamper-evident:

- `h0 = SHA-256(canonical(event0) || "GENESIS")`
- `hi = SHA-256(canonical(eventi) || hi-1)`

Include:

- `auditTrailChain[i].hash`
- `auditTrailChain[i].eventId` (or stable index)

This gives a "timeline integrity" story that's easy to explain to verifiers.

### Signature

Use Ed25519 for:

- Small signatures
- Fast verification
- Widely supported libraries

---

## Key Management (MVP-Safe)

Minimum viable approach:

- A single signing key stored in server secret storage
- Publish a "key ring" endpoint (or static JSON) listing active public keys by `keyId`
- Include `keyId` in every bundle

Rotation plan:

- Support multiple `keyId`s simultaneously
- Never re-sign old bundles with new keys
- Mark keys as `active` / `retired`, but keep public keys available indefinitely for verification

---

## Verification Story (What a Third Party Does)

Given a `proof.json`:

1. Canonicalize record (as defined by v1)
2. Compute `root`
3. Look up `publicKey` by `keyId` (either embedded or fetched from a stable Provenance key registry)
4. Verify `Ed25519(publicKey, root, signature)`

Optionally:

- Recompute the audit trail chain and ensure it matches

---

## Limitations (Explicitly Stated)

Proof Bundles prove integrity and origin of the **record**, not truth of authorship beyond what Provenance observed:

- They do not prevent external AI use and retyping
- They do not prove the published post matches the snapshot
- They do not prove factual correctness

They make tampering with the public audit record detectable.

---

## Implementation Notes (Non-Spec)

This concept aligns with the explicit Post-MVP direction already stated in `PRODUCT_SPEC.md`:

- Hash-chained event logs
- Signed snapshot bundles
- Downloadable verification records

The first version can ship as:

- A new route handler: `GET /api/badges/[verificationId]/proof`
- A verification page button that downloads it
- A tiny CLI verifier (Node) for early adopters

