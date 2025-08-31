const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL, 
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        const name =
          profile.displayName ||
          [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
          'User';
        if (!email) return done(new Error('No email from Google'));
        const pwd = 'google_' + profile.id;

        const upsert = `
          INSERT INTO users (name, email, password_hash)
          VALUES ($1,$2,$3)
          ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
          RETURNING id, name, email
        `;
        const { rows } = await db.query(upsert, [name, email, pwd]);
        const user = rows[0];

        const calCheck = await db.query(
          'SELECT id FROM calendars WHERE user_id = $1 ORDER BY created_at LIMIT 1',
          [user.id]
        );
        if (calCheck.rows.length === 0) {
          await db.query(
            "INSERT INTO calendars (user_id, name, is_default, type) VALUES ($1, $2, true, 'personal')",
            [user.id, 'Lịch của tôi']
          );
        }

        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);

module.exports = passport;
