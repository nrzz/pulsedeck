import type { WebSocket } from 'ws';
import type { WsMessage } from '@pulsedeck/shared';

type Client = WebSocket & { isAlive?: boolean };

export class WsHub {
  private clients = new Set<Client>();
  private heartbeat: ReturnType<typeof setInterval> | null = null;

  add(socket: Client) {
    this.clients.add(socket);
    socket.isAlive = true;
    socket.on('pong', () => {
      socket.isAlive = true;
    });
    socket.on('close', () => {
      this.clients.delete(socket);
    });
  }

  broadcast<T>(message: WsMessage<T>) {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }

  send<T>(socket: Client, message: WsMessage<T>) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message));
    }
  }

  get size() {
    return this.clients.size;
  }

  startHeartbeat(intervalMs = 30000) {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      for (const client of this.clients) {
        if (client.isAlive === false) {
          client.terminate();
          this.clients.delete(client);
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }
}
