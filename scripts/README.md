# Scripts

## broadcast-offer.mjs

Broadcast a parameterized replaceable offer event (kind 30000) to one or more Nostr relays using `nostr-tools`.

### Prerequisites

- Node.js 18+
- Env var `NOSTR_PRIVATE_KEY` set to either an `nsec…` or hex secret key.

### Example

PowerShell:

```powershell
$env:NOSTR_PRIVATE_KEY="nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
node scripts/broadcast-offer.mjs --amount=100 --currency=USD --merchant=amazon --discount=5 --description="Need $100 Amazon purchase, 5% discount" --relays=wss://relay.damus.io,wss://relay.snort.social --d=offer-100-usd-amazon-<unique-id>
```

bash:

```bash
export NOSTR_PRIVATE_KEY="nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
node scripts/broadcast-offer.mjs --amount=100 --currency=USD --merchant=amazon --discount=5 --description="Need $100 Amazon purchase, 5% discount" --relays=wss://relay.damus.io,wss://relay.snort.social --d=offer-100-usd-amazon-<unique-id>
```

### Notes

- The event kind is 30000 with a required `d` tag for parameterized replaceable semantics.
- `--currency` currently accepts a small allowlist (e.g., `USD`, `EUR`).
- If running in Node, a WebSocket polyfill may be used for compatibility.


