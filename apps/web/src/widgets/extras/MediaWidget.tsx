import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import type { WidgetProps } from '../registry';

type MediaInfo = { title?: string; artist?: string; playing?: boolean };

export function MediaWidget({ id }: WidgetProps) {
  const [media, setMedia] = useState<MediaInfo | null>(null);

  useEffect(() => {
    const poll = async () => {
      const bridge = window.pulsedeck;
      try {
        const info = bridge?.getMedia ? await bridge.getMedia() : null;
        setMedia(info);
      } catch {
        setMedia(null);
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <WidgetShell id={id} title="Media">
      {!media?.title ? (
        <div className="text-sm text-ink-muted">No media playing</div>
      ) : (
        <div className="space-y-1">
          <div className="font-medium truncate">{media.title}</div>
          {media.artist && <div className="text-xs text-ink-muted truncate">{media.artist}</div>}
          {media.playing != null && (
            <div className="text-[10px] text-ink-muted">{media.playing ? 'Playing' : 'Paused'}</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
