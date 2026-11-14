# Startup

How dsh-superagent is started on the local WSL machine today. This page describes the setup that is already in place. To set up a new machine, follow [SETUP.md](SETUP.md); for the full reference, read [docs/006-deployment.md](docs/006-deployment.md).

## What is already in place

| Piece | Where | Notes |
| --- | --- | --- |
| DeepSeek Harness | `dsh` on `PATH` (`0.2.1-rc.3`, Node 24 via nvm) | |
| tmux | `/usr/bin/tmux` | The service runs in tmux session `dsh-superagent` and survives closing the terminal |
| DSH profile | `~/.dsh/profiles/superagent/` | Separate from the everyday `web` profile. Loads this repo as the `dsh-superagent` bundle through `link:` to this checkout |
| Machine config | `~/.dsh/profiles/superagent/cordis.patch.yml` | Web server `127.0.0.1:3082`, `stateDir` `~/.dsh/state/superagent`, Feishu enabled, model `deepseek-official` / `deepseek-flash` |
| DeepSeek key | `~/.config/dsh-superagent/env` (mode 600) | Holds `DEEPSEEK_API_KEY`. Never copy it into the repo |
| Launcher | `~/.local/bin/dsh-superagent-local` | Wraps `scripts/dsh-superagent` and hands it the key (see below) |
| Console | `panel/` (built into `panel/dist/`) | Opened automatically in a pane beside DSH on start |

## Start, stop, status

Always use the launcher, not `scripts/dsh-superagent` directly:

```sh
~/.local/bin/dsh-superagent-local start
~/.local/bin/dsh-superagent-local status
~/.local/bin/dsh-superagent-local restart
~/.local/bin/dsh-superagent-local stop
```

Why the launcher: the DeepSeek provider reads `DEEPSEEK_API_KEY` from the process's launch environment, and `scripts/dsh-superagent` passes no environment to tmux. The launcher reads only that key from `~/.config/dsh-superagent/env`, exports it, also sets it on an already-running tmux server, and then runs `scripts/dsh-superagent` with the same arguments. Started without it, DSH comes up without a working model.

`start` waits up to a minute and prints the startup log path. Exit codes (also for `status` and `restart`): `0` running normally; `1` not running, duplicated or unreachable, a restart may fix it; `2` a Source or other part reports an error; `3` waiting for setup. A restart fixes neither `2` nor `3`.

`stop` writes a manual-stop marker (`manually_stopped: true` in `status`), so an hourly check started with `--respect-stop` leaves it stopped until the next `start`.

## Where to look once it runs

- DSH UI: `http://127.0.0.1:3082/`, then **Superagent** in the sidebar. The first visit in a browser needs the sign-in URL from the first line of the newest log in `.artifacts/` (`dsh web: http://127.0.0.1:3082/?token=…`); it sets a 30-day cookie.
- Standalone console: `http://127.0.0.1:5178` (see [panel/README.md](panel/README.md)).
- tmux: `tmux attach -t dsh-superagent` (window `server`: DSH in one pane, the console in a second pane split below it).
- Logs: `.artifacts/dsh-superagent-superagent-<date>-<time>-<pid>.log`. A healthy start shows `[llm-deepseek-api-key] … loaded 2 model(s)`, which proves the key reached DSH.

## After changing code

The profile links to this checkout but loads the built output in `lib/`, so rebuild before restarting:

```sh
pnpm install && pnpm build                      # bundle (src/ -> lib/)
pnpm -C panel install && pnpm -C panel build    # console, only if panel/ changed
~/.local/bin/dsh-superagent-local restart
```

Back up `~/.dsh/state/superagent/orchestrator.sqlite` first when the change touches the database: a database migrated by a newer version cannot be opened by an older one. `pnpm check` runs the typecheck, tests and build.

## Troubleshooting

- The newest log lacks `loaded 2 model(s)`, or Sessions fail on the model: DSH was started without the launcher, or the env file is missing. Restart with the launcher.
- `Console skipped: …`: the console is not built, or something already listens on port 5178. DSH still runs.
- "authentication required" in the DSH UI: open the sign-in URL from the newest log.
- `An existing orchestrator answers at this URL`: another instance is already on port 3082; check `status` before starting again.
- Anything else: the Troubleshooting section of [docs/006-deployment.md](docs/006-deployment.md#troubleshooting).
