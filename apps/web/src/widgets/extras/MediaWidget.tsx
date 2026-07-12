import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import type { WidgetProps } from '../registry';

type MediaInfo = { title?: string; artist?: string; playing?: boolean };

export function MediaWidget({ id }: WidgetProps) {
  const [media, setMedia] = useState<MediaInfo | null>(null);

  useEffect(() => {
    const poll = () => {
      const bridge = window.pulsedeck as (typeof window.pulsedeck & { media?: MediaInfo; getMedia?: () => MediaInfo | null }) | undefined;
      const info = bridge?.getMedia?.() ?? bridge?.media ?? null;
      setMedia(info);
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
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
