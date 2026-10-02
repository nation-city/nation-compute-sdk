# Security policy

NATION takes the security of this code seriously, including this SDK and its examples.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report it privately through GitHub: open this repository's **Security** tab, choose **Report a vulnerability**, and describe:

- what you found and where (file and line if you can);
- how to reproduce it;
- what an attacker could do with it.

We will acknowledge your report, keep you updated while we fix it, and credit you when the fix is published if you'd like.

## What is in scope

- The SDK helpers in `js/` and `python/`, and the examples.
- Anything that could leak or mishandle an API key.
- For problems in the NATION Compute API itself, use the same private channel. Please do not test against other people's accounts.

Problems in third-party packages (for example the official `openai` SDKs) are also welcome. Where it makes sense, please report them upstream as well.
