import * as socketio from 'socket.io';
import { engineLogger } from '../../common/logging';
import EventEmitter = NodeJS.EventEmitter;

export class EngineLogStreamer {
  private cleanup: Function;
  private readonly firstConnectionQuery = {
    start: 0,
    limit: 10,
    from: 'now',
    until: '-24hr',
    order: 'desc' as 'desc',
    fields: ['level', 'timestamp', 'message'],
  };

  constructor(private channel: EventEmitter) {}

  init() {
    const logStreamListener = logData => {
      this.channel.emit(
        'on-log',
        JSON.stringify({
          level: logData.level,
          message: logData.message,
          timestamp: logData.timestamp,
        })
      );
    };
    const logStream = engineLogger.stream({ start: -1 });
    logStream.on('log', logStreamListener);
    this.cleanup = () => logStream.removeListener('log', logStreamListener);
  }

  onNewConnection(client: socketio.Socket) {
    engineLogger.query(this.firstConnectionQuery, (err, results) => {
      if (err) {
        console.log(err);
      }
      const docs = results['file'] || [];
      client.emit('on-connecting', JSON.stringify(docs.reverse()));
    });
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}
