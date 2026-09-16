![Agent Skills](assets/og.png)

# Agent Skills

Private Agent Skills to help developers using AI agents with Supabase and
Vercel/Netlify deployment workflows. Agent Skills are folders of instructions,
scripts, and resources that agents like Claude Code, Cursor, Github Copilot,
etc... can discover and use to do things more accurately and efficiently.

The skills in this repo follow the [Agent Skills](https://agentskills.io/)
format.

## Installation

```bash
npx skills add bpthevenot-hub/agent-skills
```

### Claude Code Plugin

You can also install the skills in this repo as Claude Code plugins

```bash
/plugin marketplace add bpthevenot-hub/agent-skills
/plugin install supabase-postgres-best-practices@agent-skills
/plugin install using-supabase@agent-skills
/plugin install vercel-netlify-automation@agent-skills
```

## Available Skills

<details>
<summary><strong>supabase-postgres-best-practices</strong></summary>

Postgres performance optimization guidelines from Supabase. Contains references
across 8 categories, prioritized by impact.

**Use when:**

- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Working with Row-Level Security (RLS)

**Categories covered:**

- Query Performance (Critical)
- Connection Management (Critical)
- Schema Design (High)
- Concurrency & Locking (Medium-High)
- Security & RLS (Medium-High)
- Data Access Patterns (Medium)
- Monitoring & Diagnostics (Low-Medium)
- Advanced Features (Low)

</details>

<details>
<summary><strong>using-supabase</strong></summary>

Private end-to-end guide for building applications with Supabase, covering
project setup, Auth, Database, Storage, Edge Functions, Realtime, client
libraries, and the CLI — with an emphasis on keeping project credentials
private.

**Use when:**

- Setting up a Supabase project and wiring connection strings
- Implementing authentication or Row Level Security policies
- Writing queries or schema migrations
- Uploading files to Storage buckets with access control
- Building Edge Functions or Realtime subscriptions
- Configuring the supabase-js client or the Supabase CLI

**Categories covered:**

- Getting Started (High)
- Auth (Critical)
- Database (High)
- Storage (Medium-High)
- Edge Functions (Medium)
- Realtime (Medium)
- Client Libraries (Medium-High)
- CLI & Tools (Low-Medium)

</details>

<details>
<summary><strong>vercel-netlify-automation</strong></summary>

Deployment automation for Vercel and Netlify with a Desktop-like workflow:
Git-connected deploys, GitHub Actions CI/CD, local file watchers, and deploy
token security.

**Use when:**

- Connecting a Git repo to Vercel and/or Netlify
- Writing a GitHub Actions workflow that builds and deploys
- Building a local watcher that auto-commits and pushes
- Securing deployment tokens and protecting the main branch

**Categories covered:**

- Git Repository Setup (High)
- Platform Connection (High)
- CI/CD Workflow (Medium-High)
- Desktop-like Watchers (Medium)
- Security & Monitoring (Critical)
- Documentation (Low-Medium)

</details>

## Usage

Skills are automatically available once installed. The agent will use them when
relevant tasks are detected.

**Examples:**

```
Optimize this Postgres query
```

```
Review my schema for performance issues
```

```
Help me add proper indexes to this table
```

```
Set up auth with row level security on my Supabase project
```

```
Create a GitHub Actions workflow that deploys to Vercel
```

## Skill Structure

Each skill follows the [Agent Skills Open Standard](https://agentskills.io/):

- `SKILL.md` - Required skill manifest with frontmatter (name, description, metadata)
- `AGENTS.md` - Compiled references document (generated)
- `references/` - Individual reference files

## License

MIT
