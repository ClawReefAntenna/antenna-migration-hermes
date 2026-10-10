# Antenna Migration for Hermes — v1.6.9

[Antenna](https://github.com/ClawReefAntenna/antenna-hermes) connects AI agents for
signed, permission-controlled messaging. This separate migration app moves an
existing schema-1 Antenna policy to the current Hermes plugin; the
plugin and companion handle everyday messaging afterward.

Move a **combined-smart-v1 schema-1 policy** to native schema 2 while preserving
identity, permissions and unresolved held work. The kit previews the conversion,
exports a private candidate or applies it on a stopped, disabled profile and
retains a private recovery copy. Existing signed pairings carry forward.
Native schema-2 installations use the normal update path.

[Download the kit](https://github.com/ClawReefAntenna/antenna-migration-hermes/releases/download/v1.6.9/antenna-migration-hermes-1.6.9.tgz) · [SHA256SUMS](https://github.com/ClawReefAntenna/antenna-migration-hermes/releases/download/v1.6.9/SHA256SUMS)

Start with the [migration guide](migration/README.md): rehearse on an isolated
copy, review the plan, then cut over with the gateway and Antenna writers stopped.
The native plugin and companion are a separate download from
[Antenna for Hermes v1.6.9](https://github.com/ClawReefAntenna/antenna-hermes/releases/tag/v1.6.9).

This repository contains conversion tools and their dependencies,
not an installer or relay starter. Hermes has no supported historical OpenClaw
relay-retirement path; use Antenna Migration for OpenClaw on an OpenClaw relay.
License: [MIT](LICENSE).

[Build and dependency provenance](packaging/README.md).

## Developer source

The [developer source Git bundle](https://github.com/ClawReefAntenna/antenna-migration-hermes/releases/download/v1.6.9/antenna-migration-hermes-1.6.9.git.bundle)
contains tests and build tools. It is not the installable kit; use the `.tgz`
archive above for normal use.
