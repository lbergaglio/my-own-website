export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const runtimeConfig = {
    auth0Domain: String(process.env.AUTH0_DOMAIN || '').trim(),
    auth0ClientId: String(process.env.AUTH0_CLIENT_ID || '').trim(),
    auth0Audience: String(process.env.AUTH0_AUDIENCE || '').trim(),
    auth0RedirectUri: String(process.env.AUTH0_REDIRECT_URI || '').trim(),
    auth0Connection: String(process.env.AUTH0_CONNECTION || 'github').trim(),
    githubUsername: String(process.env.GITHUB_USERNAME || 'lbergaglio').trim(),
    githubStatsCacheMinutes: Number(process.env.GITHUB_STATS_CACHE_MINUTES || 30),
  };

  res.status(200).end(`window.__CV_CONFIG = ${JSON.stringify(runtimeConfig)};`);
}