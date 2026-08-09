# Security Policy

## Supported versions

Security fixes are applied to the latest published release line. Until the
v1.0.0 release is certified, the current 0.9.x packages and v1 release
candidates are supported on a best-effort basis for critical fixes.

## Reporting a vulnerability

Do not file a public issue for a suspected vulnerability. Report it privately
to the repository maintainers through GitHub Security Advisories for
`mineclover/context-action`, including reproduction steps, affected package and
version, impact, and any proposed mitigation.

The maintainers will acknowledge a report, assess severity, coordinate a fix,
and publish an advisory after users have a reasonable upgrade path. Public
disclosure is coordinated with the reporter whenever possible.

## Release controls

Release candidates require a clean evidence bundle, dependency audit, package
integrity checks, pinned CI actions, npm provenance-capable publishing, and an
external-consumer smoke test. Experimental packages and browser integrations
do not bypass the framework's authorization or approval contracts.
