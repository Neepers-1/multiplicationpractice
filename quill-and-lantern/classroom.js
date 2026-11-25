const onGitHub = location.hostname.endsWith('.github.io');
export const classConnected = !onGitHub;

// The hosted classroom uses first-party HttpOnly sessions. The Pages edition
// offers the original journal in practice mode until the class host is linked.
export async function classFetch(path, options) {
  if (onGitHub) {
    const anonymous = path === 'me';
    return Response.json(anonymous ? {user:null} : {error:'Class sign-in is being connected.'}, {status:anonymous ? 200 : 503});
  }
  return fetch('./api/'+path, options);
}
