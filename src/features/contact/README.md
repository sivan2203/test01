# Contact Feature

The MVP contact adapter seam supports exactly one enabled channel: `telegram`.

`telegram.ts` is a pure server/client-safe domain module. It accepts a bare
username, an optional `@` prefix, or an HTTPS public profile link for
`t.me`, `telegram.me`, or `telegram.dog`. It returns one canonical username
without `@` or a `null` clear value. Query strings, hashes, extra path
segments, other hosts, whitespace, and invalid username characters are
rejected.

The shared public CTA owns the Story 3.5 handoff: the server re-reads the
published product snapshot, prepares a title/price/product-URL message, records
the CTA intent before returning the Telegram URL, and returns the same message
for the copy fallback. Telegram delivery, sent-message confirmation, orders,
and additional contact channels remain out of scope.
