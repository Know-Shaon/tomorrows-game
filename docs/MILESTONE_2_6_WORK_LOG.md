# M2.6 art production work log

30 October 2026. Painted Workshop direction retained. No baseline recreation.

## Authorized limits

- Microwave pilot: **150 credits maximum**; no other game's production art before pilot acceptance.
- Total M2.6 ceiling: **650 credits**, with a preference to spend substantially less.
- Keep **250 credits unspent**. No video during the pilot.
- Starting balance freshly observed: **1,004.0 credits**, authenticated response `code: 200`.
- No key is stored in this log or anywhere in project files.

## Public model-price verification

The following are public website pages, not pricing API endpoints:

| Candidate model             | Live schema                                                                                                       | Official public model page                                      | Pricing outcome                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `nano-banana-2-1`           | `https://docs.kie.ai/market/google/nanobanana-2-1.md`, HTTP 200; reference images, 1K/2K/4K and PNG/JPG supported | `https://kie.ai/nano-banana-2-1`, HTTP 403 Cloudflare challenge | No current credits-per-generation independently verified. |
| `gpt-image-2-text-to-image` | `https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image.md`, HTTP 200                                           | `https://kie.ai/gpt-image-2`, HTTP 403 Cloudflare challenge     | No current credits-per-generation independently verified. |

Ordinary HTML requests and a Markdown representation request to both model pages returned 403. Public search did not expose a usable official current price table. The user supplied example prices, but explicitly required immediate official-page verification before use; those examples and schema callback-credit examples were not substituted for verified prices.

Evidence: `.cache/kie-public-pricing/model-page-access.json`, model-search JSON files in that directory, and the saved live Nano Banana schema. The older generic `/pricing` failure was not used as proof that all model pricing was unavailable: the model pages above were checked directly.

## Paid batch ledger

No batch submitted. Candidate-only plan: a small 1K/2K Microwave batch, no more than four images, followed by visual review before another request. Exact model, resolution, published unit price, source URL, verification time and `request count × unit price` must be recorded before submission. That calculation is pending verified pricing.

| Paid requests | Generated assets | Generation credits spent | Microwave cap used | Total cap used |
| ------------- | ---------------- | ------------------------ | ------------------ | -------------- |
| 0             | 0                | 0                        | 0 / 150            | 0 / 650        |

No reference upload, purchase, gameplay edit, new dependency, commit, push or deployment. No before/after improvement or pilot acceptance is claimed. The next required step is access to current official model pricing; M2.6 remains incomplete.
