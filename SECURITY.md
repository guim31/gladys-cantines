# Security policy

## Reporting a vulnerability

Please do **not** report a security problem in a public issue, pull request or
forum post.

Report it privately through GitHub instead: open the **Security** tab of this
repository, then **Report a vulnerability**.

No such button? Private reporting is not enabled yet: open an issue that only
asks the maintainers for a private contact, without any detail of the problem,
and send the report there.

Include, when you can:

- the version of the integration and of Gladys;
- what an attacker can do, and the steps to reproduce it;
- the log lines that help (remove tokens, passwords and addresses first).

The fix ships as a new version of the integration, and the advisory is
published once users can update.

## Supported versions

Only the latest release receives security fixes: update the integration from
Gladys before reporting a problem.

## Scope

In scope: the code of this repository and the Docker image it publishes.

What the integration handles:

- **Network**: outgoing HTTPS requests only, to the public open data portals
  of the cities (`data.toulouse-metropole.fr`, `data.rennesmetropole.fr`,
  `data.nantesmetropole.fr`), without any credential. It listens on no port.
- **Secrets**: none. The configuration holds the cities ticked, the watched
  words, the refresh interval and the language.
- **`/data`**: one small file, `fired.json`, the scene triggers already fired
  in the last days (so that a restart does not fire them twice).
- The portal answers are untrusted input: bounded in size (5 MB), parsed as
  JSON, their texts shown as plain text.

Out of scope: Gladys Assistant itself (see its
[security policy](https://github.com/GladysAssistant/Gladys/security/policy)),
and the open data portals the integration reads.
