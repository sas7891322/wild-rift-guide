import fs from 'node:fs';

const html = fs.readFileSync('pages/players.html', 'utf8');
const js = fs.readFileSync('assets/js/players.js', 'utf8');
const css = fs.readFileSync('assets/css/style.css', 'utf8');
const sql = fs.readFileSync('supabase/wild-rift-guide-v91-player-finder.sql', 'utf8');
const errors = [];

const expect = (condition, message) => { if (!condition) errors.push(message); };

expect(html.includes('v91 正式媒合'), 'players page version badge is missing');
expect(html.includes('id="playerWantedRole"'), 'wanted-role filter is missing');
expect((html.match(/name="wantedRoles"/g) || []).length === 6, 'wanted-role form must provide six choices');
expect(html.includes('id="playerReportDialog"'), 'report dialog is missing');
expect(!html.includes('目前是前端展示版'), 'legacy demo notice is still present');
expect(!js.includes('const samples ='), 'sample player data is still bundled');
expect(js.includes("from('player_posts')"), 'player_posts integration is missing');
expect(js.includes("from('player_reports')"), 'player_reports integration is missing');
expect(js.includes("auth.memberUrl(auth.currentRelativeUrl())"), 'login return flow is missing');
expect(js.includes('POST_DAYS = 14'), '14-day post renewal is missing');
expect(css.includes('.player-chip.wanted'), 'wanted-role visual style is missing');
expect(css.includes('.player-wanted-roles'), 'wanted-role form layout is missing');
expect(sql.includes('create table if not exists public.player_posts'), 'player_posts SQL is missing');
expect(sql.includes('create table if not exists public.player_reports'), 'player_reports SQL is missing');
expect(sql.includes('enable row level security'), 'RLS enablement is missing');
expect(sql.includes('player_posts_read_public_or_own'), 'public/owner read policy is missing');
expect(sql.includes('player_posts_update_own'), 'owner update policy is missing');
expect(sql.includes('player_reports_insert_own'), 'report insert policy is missing');
expect(sql.includes('player_posts_one_per_user'), 'one-post-per-account constraint is missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  version: 'v91-player-finder',
  sharedPosts: true,
  authenticatedPublishing: true,
  desiredRoleFilter: true,
  editDeleteRenew: true,
  reports: true,
  postLifetimeDays: 14,
  rowLevelSecurity: true
}, null, 2));
