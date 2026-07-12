# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a vulnerability

Please **do not** open a public issue for security-sensitive reports.

1. Prefer [GitHub Security Advisories](https://github.com/nrzz/pulsedeck/security/advisories/new) for this repository.
2. Or email the maintainers via a private channel linked from the GitHub profile **nrzz**.

Include:

- Affected version / commit
- Reproduction steps
- Impact (local privilege, data exposure, RCE, etc.)
- Any suggested fix

We aim to acknowledge reports within **7 days** and ship a fix or mitigation as soon as practical.

## Scope notes

PulseDeck is a **local** Windows dashboard:

- The API binds to `127.0.0.1` only by design.
- User layouts and optional API keys live in `%APPDATA%\PulseDeck\`.
- Outbound HTTPS is used for crypto, stocks, weather, and public IP lookups.

Reports about third-party APIs (CoinGecko, Yahoo, Finnhub, etc.) should go to those vendors unless PulseDeck mishandles their responses.
