import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import type { StudioAsset, StudioSite } from '../../lib/studioSite';
import { STUDIO_DEMO } from '../../lib/studioDemo';
import StudioRenderer from './StudioRenderer';

/** Full-page preview of a project at /studio/<id> (logged-in creators only) or the fictional example at /studio/exemplo. */
export default function StudioPreviewPage({ id }: { id: string }) {
  const [state, setState] = useState<{ site?: StudioSite; assets: StudioAsset[]; error?: string }>(
    id === 'exemplo' ? { site: STUDIO_DEMO, assets: [] } : { assets: [] });

  useEffect(() => {
    if (id === 'exemplo') return;
    const controller = new AbortController();
    const stop = onAuthStateChanged(auth, async user => {
      if (!user) { setState({ assets: [], error: 'Entre no portal da Atlas para ver esta prévia.' }); return; }
      try {
        const response = await fetch(`/api/studio?view=project&id=${encodeURIComponent(id)}`, {
          headers: { Authorization: 'Bearer ' + await user.getIdToken() }, signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.project) throw new Error(data?.error || 'Não foi possível abrir esta prévia.');
        if (!data.project.site) throw new Error('O site deste projeto ainda não foi construído.');
        setState({ site: data.project.site, assets: data.project.assets || [] });
      } catch (error) {
        if (!controller.signal.aborted) setState({ assets: [], error: (error as Error).message });
      }
    });
    return () => { controller.abort(); stop(); };
  }, [id]);

  useEffect(() => {
    if (state.site) document.title = state.site.meta.title;
  }, [state.site]);

  if (state.error) return <p role="alert" style={{ padding: 32, fontFamily: 'system-ui', color: '#eee', background: '#111', minHeight: '100vh' }}>{state.error}</p>;
  if (!state.site) return <p role="status" style={{ padding: 32, fontFamily: 'system-ui', color: '#eee', background: '#111', minHeight: '100vh' }}>Carregando prévia…</p>;
  return <StudioRenderer site={state.site} assets={state.assets} />;
}
