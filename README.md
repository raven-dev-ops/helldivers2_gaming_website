# Galactic Phantom Division Website

This is the repository for the Galactic Phantom Division website. It is a Next.js application built with TypeScript and styled-components, featuring user authentication with NextAuth.js and MongoDB.

This project is proprietary and not open source. Forks (including private forks) are not permitted. Please read the LICENSE file and the **License & Usage** section below before using any of the code or assets.

## Recent Updates

- Centered navigation bar text and added Super Store link under the Intel menu.
- Added auto-playing background music with volume control and visible song credits.
- Introduced tabbed leaderboards, merch shop disclaimer, and new profile tabs for roles, awards, squad, and rankings.
- Exposed merit points across the site and added a rotating alert bar beneath the navigation.

## Features

- **Next.js Framework:** Leverages the power of Next.js for server-side rendering, routing, and API routes.
- **TypeScript:** Provides static typing for improved code quality and maintainability.
- **Styled Components:** Utilizes styled-components for styling with CSS-in-JS.
- **NextAuth.js:** Handles user authentication, including social login providers like Discord (configured). NextAuth.js automatically manages the Discord OAuth2 flow, so you don't need to manually construct authorization URLs.
- **MongoDB Integration:** Connects to a MongoDB database for data storage (using Mongoose).
- **Particle Effects:** Incorporates `tsparticles` for interactive particle effects.
- **Swiper:** Uses Swiper for creating touch-enabled sliders.
- **ESLint:** Configured for code linting to maintain code style and prevent errors.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (v9 or higher; enable via Corepack)
- MongoDB instance (local or hosted)
- Discord Developer account (for OAuth2 login)

### Package Manager

This project uses [pnpm](https://pnpm.io) for all workflows. If pnpm is not installed, enable it with:

```bash
corepack enable pnpm
```

All commands below assume pnpm.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/raven-dev-ops/helldivers2_clan_website.git
   cd helldivers2_clan_website
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

### Environment Variables

Create a `.env.local` file in the project root and define the following variables:

```
MONGODB_URI=<your-mongodb-connection-string>
MONGODB_DB=<database-name>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-a-secret-key>
DISCORD_CLIENT_ID=<discord-client-id>
DISCORD_CLIENT_SECRET=<discord-client-secret>
# Optional: configure Super Store upstream JSON endpoint for /api/store/rotation
SUPERSTORE_UPSTREAM=https://your-proxy-or-json-endpoint
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
REDIS_URL=redis://localhost:6379
DISCORD_WEBHOOK_URL=<default-fallback-webhook-url>
DISCORD_APPLICATION_WEBHOOK_URL=<webhook-for-user-applications>
DISCORD_LEADERBOARD_DAILY_WEBHOOK_URL=<webhook>
DISCORD_LEADERBOARD_WEEKLY_WEBHOOK_URL=<webhook>
DISCORD_LEADERBOARD_MONTHLY_WEBHOOK_URL=<webhook>
DISCORD_LEADERBOARD_YEARLY_WEBHOOK_URL=<webhook>
DISCORD_LEADERBOARD_SOLO_WEBHOOK_URL=<webhook>
DISCORD_INTEL_WEBHOOK_URL=<webhook>
DISCORD_TWITCH_WEBHOOK_URL=<webhook>
DISCORD_GUILD_ID=<discord-guild-id>
DISCORD_BOT_TOKEN=<bot-token-if-using-role-name-mapping>
```

Notes:
- /api/users/me responses are cached privately for ~60s and the app now avoids unnecessary `cache: 'no-store'` on the client to reduce latency. Expect the profile data to update within a minute of changes.
- /api/store/rotation returns empty arrays unless `SUPERSTORE_UPSTREAM` is set to a valid JSON endpoint (or proxy) that exposes the rotating sets.

### Discord OAuth Scopes

When configuring your Discord application, ensure the OAuth scopes include:

- `identify`
- `guilds`
- `guilds.members.read`

These scopes are required for Discord authentication and guild access.

### Local Development

After installing dependencies and setting environment variables, start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Testing

Run the test suite with:

```bash
pnpm test
```

To validate outgoing webhooks, set the Discord webhook envs above and run:

```bash
pnpm webhooks:test
```

Health endpoint exposes presence of webhook envs (booleans only):

```bash
curl -s http://localhost:3000/api/health | jq .env
```

### Deployment

Build the production bundle and start the server:

```bash
pnpm build
pnpm start
```

Ensure that the same environment variables are configured in your hosting environment.

## License & Usage

This project is proprietary to raven-dev-ops and the Galactic Phantom Division. All rights are reserved unless explicitly granted in writing.

- You may view this repository on GitHub and clone it for limited, personal, non-commercial local evaluation only.
- You may not create public or private forks, mirrored repositories, or otherwise host this code under your own account or organization without prior written permission from raven-dev-ops.
- You may not publicly host, redistribute, rebrand, or reuse any part of the code, assets, or branding from this repository in your own projects, services, or communities without prior written permission from raven-dev-ops.
- See the `LICENSE` file in this repository for the full license text and terms.
