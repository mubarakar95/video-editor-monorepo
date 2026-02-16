import type { TimelineSchema, Timeline, Track, Clip, MediaSource, RationalTime } from '../types.js';

export function fromFCPXML(xml: string): TimelineSchema {
  throw new Error('FCPXML import not yet implemented. This is a stub implementation.');
}

export function toFCPXML(schema: TimelineSchema): string {
  const { timeline, sources, version } = schema;
  
  const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    ${sources.map((source, i) => `
    <asset id="r${i + 1}" name="${escapeXml(source.name)}" src="${escapeXml(source.path)}" duration="${formatFCPXMLDuration(source.metadata?.duration)}"/>`).join('')}
  </resources>
  <library>
    <event name="${escapeXml(timeline.name)}">
      <project name="${escapeXml(timeline.name)}">
        <sequence duration="${formatFCPXMLDuration({ value: 0, rate: timeline.metadata.frameRate })}" format="r1">
          <spine>
            ${timeline.tracks.map((track) => formatFCPXMLTrack(track, sources)).join('\n')}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;

  return fcpxml;
}

function formatFCPXMLTrack(track: Track, sources: MediaSource[]): string {
  return track.clips
    .map((clip) => {
      const sourceIndex = sources.findIndex((s) => s.id === clip.sourceId);
      const assetRef = sourceIndex >= 0 ? `r${sourceIndex + 1}` : 'r1';
      return `            <asset-clip name="${escapeXml(clip.name)}" ref="${assetRef}" offset="${formatFCPXMLTime(clip.timelineRange.start)}" duration="${formatFCPXMLDuration(clip.timelineRange.duration)}" start="${formatFCPXMLTime(clip.sourceRange.start)}"/>`;
    })
    .join('\n');
}

function formatFCPXMLTime(time: RationalTime | undefined): string {
  if (!time) return '0s';
  const seconds = time.value / time.rate;
  if (seconds === Math.floor(seconds)) {
    return `${seconds}s`;
  }
  return `${seconds.toFixed(3)}s`;
}

function formatFCPXMLDuration(time: RationalTime | undefined): string {
  return formatFCPXMLTime(time);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
