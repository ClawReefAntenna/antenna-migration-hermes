# Antenna Migration for Hermes — v1.6.9

Bring your existing identity and permissions into native
[Antenna for Hermes](https://github.com/ClawReefAntenna/antenna-hermes), which handles everyday agent messaging.
This standalone kit prepares the conversion and keeps private recovery copies.
Install the native plugin and bundled companion separately.

[Download the kit](https://github.com/ClawReefAntenna/antenna-migration-hermes/releases/download/v1.6.9/antenna-migration-hermes-1.6.9.tgz), verify its
[SHA-256 checksum](https://github.com/ClawReefAntenna/antenna-migration-hermes/releases/download/v1.6.9/SHA256SUMS), and extract it into its own directory. Run the
commands below from the extracted kit root. Requires Linux, Node.js and Python
with PyYAML, as supplied by the matching Hermes installation.

## Supported transition

Migrate an experimental **schema-1 combined-smart-v1 policy** to schema 2.
Combined legacy Smart becomes Both, including explicit per-peer selections.
Identity, destinations, signing pins and approval bits are preserved; ordinary
approval stays independent of MCS. Unknown schemas or inbox formats stop for
manual review. Native schema-2 installations use the normal update path.

Hermes did not ship the OpenClaw v1.6.3–v1.6.7 relay. This kit does not retire
OpenClaw agents, hooks or shell approvals, convert OpenClaw configuration to YAML,
move conversation history between runtimes, or invent replacement destinations.
Use the OpenClaw migration app for that runtime's relay-retirement workflow.

## Rehearse on an isolated copy

Use the intended private Hermes `config.yaml` (owned by your user, mode 0600).
Keep the isolated rehearsal's host and state paths separate from live files.
A dry-run prints only a report, never bearer credentials or policy content:

```sh
node migration/cli.mjs /absolute/config.yaml
node migration/cli.mjs /absolute/config.yaml /new/private-policy.json
```

The export must be a new file; it is created mode 0600 and may contain credentials.
It never changes the host or inbox. Existing inbox data is checked read-only;
unsupported legacy payloads remain separate and require manual review, not conversion.
No model requests, message sends, installation or service changes occur.

## Cut over while stopped

Disable Antenna using the native Hermes lifecycle and stop **all** profile
processes and Antenna writers first. This interrupts host service; schedule it
deliberately. Review the preview, then:

```sh
node migration/cli.mjs /absolute/config.yaml --apply
```

The kit requires Antenna to be disabled in `plugins.enabled`; it does not stop
processes for you or prove that every writer has exited. Keep them stopped until
cutover is complete. Smart/Both must have a previously validated Hermes scanner
selection and native LLM override permissions; otherwise application stops.

Application keeps a private `.antenna-migration-*` recovery directory beside the
host file, then atomically replaces only the Antenna policy using native YAML
serialization and a concurrent-edit check. YAML comments/formatting may change;
unrelated settings and plugin settings are preserved semantically. Identity,
keys, lists, group grants, inbox, replay and background receipts are not rewritten.
The kit does not activate or restart Antenna or change Hermes continuation/auth policy.

## Interrupted cutover and recovery

The kit stops if the host changed since it was read. Keep writers stopped.
Preserve the recovery directory and follow its `RECOVERY.txt`. Do not blindly
restore an old host snapshot over newer settings or replace current inbox/replay
state. Inspect the host's schema and preview again before retrying. This is
operator recovery, not seamless downgrade or automatic rollback.

The native plugin/companion still need installation separately. Verify existing
destinations and scanner selection, explicitly enable/restart, and live-probe
signed admission before advertising migration. Hermes may retry/fall back to a
different model/provider under the profile's own policy.

## Check the prepared installation

Run Doctor from the matching core installation with its selected profile:

```sh
ANTENNA_HOST_CONFIG=/absolute/config.yaml /path/to/antenna/bin/antenna.sh doctor
```

A disabled-plugin complaint before activation is expected. Static checks do not
prove signed delivery. The artifact manifest binds version, source and file hashes.
