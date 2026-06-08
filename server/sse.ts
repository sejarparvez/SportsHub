import type { Response } from "express"
import type { SSEEventType } from "../shared/types"
import { SSE_KEEPALIVE_INTERVAL } from "./constants"

interface SSEClient {
	res: Response
	keepaliveTimer: ReturnType<typeof setInterval>
}

const clients = new Map<string, SSEClient>()

export function addClient(res: Response): string {
	const id = crypto.randomUUID()

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	})

	// Send initial connection acknowledgment
	res.write(`data: ${JSON.stringify({ connected: true })}\n\n`)

	// Start keepalive heartbeat
	const keepaliveTimer = setInterval(() => {
		try {
			res.write(": keepalive\n\n")
		} catch {
			removeClient(id)
		}
	}, SSE_KEEPALIVE_INTERVAL)

	clients.set(id, { res, keepaliveTimer })

	res.on("close", () => {
		removeClient(id)
	})

	return id
}

export function removeClient(id: string): void {
	const client = clients.get(id)
	if (client) {
		clearInterval(client.keepaliveTimer)
		client.res.end()
		clients.delete(id)
	}
}

export function broadcast(event: SSEEventType, data: unknown): void {
	const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
	for (const [id, client] of clients) {
		try {
			client.res.write(message)
		} catch {
			removeClient(id)
		}
	}
}
