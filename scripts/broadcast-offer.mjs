import { finalizeEvent, getPublicKey, nip19, Relay } from 'nostr-tools'
try {
    if (typeof globalThis.WebSocket === 'undefined') {
        const { default: WS } = await import('ws')
        globalThis.WebSocket = WS
    }
} catch {}

function hexToBytes(hex) {
    if (hex.startsWith('0x')) hex = hex.slice(2)
    if (hex.length % 2 !== 0) throw new Error('Invalid hex length')
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
    }
    return bytes
}

function getSecretKey() {
    const key = process.env.NOSTR_PRIVATE_KEY
    if (!key) {
        throw new Error('NOSTR_PRIVATE_KEY not set. Provide nsec or hex in env.')
    }
    if (key.startsWith('nsec')) {
        const decoded = nip19.decode(key)
        return decoded.data
    }
    return hexToBytes(key)
}

function parseArgs() {
    const args = Object.fromEntries(
        process.argv.slice(2).map((part) => {
            const [k, ...rest] = part.replace(/^--/, '').split('=')
            return [k, rest.join('=')]
        })
    )
    const parsed = {
        amount: Number(args.amount ?? '0'),
        currency: String(args.currency ?? 'USD'),
        discountPercent: Number(args.discount ?? '0'),
        merchant: String(args.merchant ?? 'generic'),
        description: String(args.description ?? ''),
        relays: String(args.relays ?? 'wss://relay.damus.io').split(',').map((s) => s.trim()).filter(Boolean),
        d: String(args.d ?? `offer-${Date.now()}`)
    }
    const allowed = new Set(['USD', 'EUR'])
    if (!allowed.has(parsed.currency)) {
        throw new Error(`currency must be one of: ${[...allowed].join(', ')}`)
    }
    return parsed
}

async function publishToRelays(relays, event) {
    for (const url of relays) {
        try {
            const relay = await Relay.connect(url)
            await relay.publish(event)
            console.log(`[ok] ${url} accepted event ${event.id}`)
            relay.close()
        } catch (err) {
            console.error(`[fail] ${url}: ${err?.message ?? String(err)}`)
        }
    }
}

async function main() {
    const seckey = getSecretKey()
    const pubkey = getPublicKey(seckey)
    const { amount, currency, discountPercent, merchant, description, relays, d } = parseArgs()

    if (!d) throw new Error('Missing d tag identifier')
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be > 0')
    if (!Number.isFinite(discountPercent) || discountPercent < 0) throw new Error('discount must be >= 0')

    const content = JSON.stringify({
        merchant,
        amount,
        currency,
        discount_percent: discountPercent,
        description
    })

    const event = {
        kind: 30000,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ['d', d],
            ['t', 'offer'],
            ['merchant', merchant],
            ['amount', String(amount), currency],
            ['discount_percent', String(discountPercent)]
        ],
        content,
        pubkey
    }

    const signed = finalizeEvent(event, seckey)
    await publishToRelays(relays, signed)
}

main().catch((err) => {
    console.error(err?.message ?? err)
    process.exit(1)
})


