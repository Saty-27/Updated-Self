# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability. Send a private report to the project owner with the affected route, impact, reproduction steps, and any suggested mitigation. Do not include production credentials or personal data.

## Operational baseline

- Store `JWT_SECRET`, `OTP_SECRET`, MongoDB credentials, and third-party keys only in the deployment secret store.
- Production secrets must be unique, randomly generated, and at least 32 characters.
- `CLIENT_URL` must list explicit HTTPS origins; wildcard CORS is rejected by design.
- Run `npm run verify` before merging and enable branch protection for the CI check.
- Use least-privilege database credentials and encrypted backups. Test restoration regularly.
- Review staff permissions and inactive accounts at least quarterly.
- Never place executable HTML or analytics scripts in database-managed site settings. Integrations must be implemented as reviewed code with a restrictive Content Security Policy.

## Data protection

Youth outreach records contain personal information. Limit exports, log administrative changes, retain only what is operationally required, and delete records according to the organization’s approved retention policy.
