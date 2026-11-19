import { auth } from '../../lib/firebase';
import type { StudioProject } from '../../lib/studioProject';

/** Authenticated call to /api/studio. GET when only a view is given, POST with a JSON body otherwise. */
export async function studioApi<T>(view: string | null, body?: object): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre na conta para usar o criador de sites.');
  const response = await fetch('/api/studio' + (view ? `?view=${view}` : ''), {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + await user.getIdToken(), ...(body && { 'Content-Type': 'application/json' }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || (response.status === 504
    ? 'A geração passou do tempo limite. Atualize o projeto em instantes para ver se terminou.'
    : 'Não foi possível concluir agora. Tente novamente.'));
  return data as T;
}

export const loadProject = (id: string) => studioApi<{ project: StudioProject }>(`project&id=${encodeURIComponent(id)}`).then(data => data.project);
export const postProject = (body: object) => studioApi<{ project: StudioProject }>(null, body).then(data => data.project);
