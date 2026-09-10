# FlyTally Identity Contract — v1

## Purpose

Training and Logbook are separate products and separate persistence domains. They share **identity**, not database access.

Training must never query the Logbook `users` or `auth_sessions` tables, import Logbook authentication code, or accept a user/account id supplied directly by a browser request.

## SSO handoff

1. Training redirects the browser to the Logbook identity handoff endpoint.
2. Logbook authenticates the browser using its own session implementation.
3. Logbook creates a short-lived signed identity assertion and redirects back to Training.
4. Training verifies the assertion and creates its own host-only Training session.
5. Every Training progress query derives `account_subject` from that verified Training session.

## Assertion format

Compact value:

`ft1.<base64url JSON claims>.<base64url HMAC-SHA256 signature>`

The signature input is exactly `ft1.<payload>` and is signed with `FLYTALLY_IDENTITY_SECRET`.

Required claims:

- `iss`: `flytally-logbook`
- `aud`: `flytally-training`
- `sub`: stable opaque FlyTally account subject; v1 Logbook emits its stable user id as a string
- `role`: `user` or `admin`
- `iat`: issued-at Unix seconds
- `exp`: expiry Unix seconds; maximum accepted assertion lifetime is five minutes
- `jti`: unique assertion id

Training rejects malformed, expired, future-dated, wrong-audience, wrong-issuer, over-long-lived or incorrectly signed assertions.

## Training session

After a valid handoff Training issues its own seven-day host-only `flytally_training_session` cookie, signed with the separate `TRAINING_SESSION_SECRET`.

The Training cookie contains only the stable account subject, role, issue time and expiry. Logbook session tokens are never copied to Training.

## Persistence boundary

Training progress lives in the Training PostgreSQL database under `account_subject`. There is deliberately no foreign key and no direct query to the Logbook database.

The identity contract can later move behind a dedicated FlyTally account service without changing the Training progress schema or learner-facing components.
