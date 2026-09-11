# Security Policy

PathwayGH is an education platform used by secondary-school students in
Ghana and Nigeria. We take reports of security issues seriously and will
respond promptly.

## Reporting a Vulnerability

Please report suspected security vulnerabilities privately - do not open
a public GitHub issue.

**Contact:** ziemwellu@gmail.com

Please include:
- A description of the issue and its potential impact
- Steps to reproduce, or a proof of concept
- Any affected URLs, endpoints, or accounts

We aim to acknowledge reports within 3 business days, and will keep you
updated as we investigate and fix the issue. We ask that you give us a
reasonable opportunity to address a report before any public disclosure.

## Scope

This policy covers the PathwayGH backend API, frontend web app, and
their infrastructure. It does not cover third-party services we
integrate with (e.g. our AI provider) - please report those directly to
the relevant vendor.

## Internal Incident Response Checklist

For maintainers, if a security incident is confirmed:

1. **Contain** - revoke/rotate any exposed credentials or tokens
   immediately (`SECRET_KEY`, database credentials, third-party API
   keys); disable the affected endpoint or feature if it can't be
   contained otherwise.
2. **Assess** - determine what data was exposed or at risk, especially
   any personal data of students or guardians, and which users/accounts
   are affected.
3. **Notify** - inform affected users if their personal data was
   exposed. If personal data of Ghanaian or Nigerian users was exposed,
   assess whether notification to Ghana's Data Protection Commission
   and/or Nigeria's NDPC is required under local law.
4. **Fix** - patch the root cause, not just the symptom; add a
   regression test where practical.
5. **Post-mortem** - write a short internal summary of what happened,
   why, and what changes (code, process, or monitoring) will prevent a
   recurrence.
