# Analytics and Google access follow-up — 9 October 2026

User supplied measurement ID `G-KV3L9112Z1` and reported access granted to the
existing service account. Read-only API probes still return 403 **SERVICE_DISABLED**,
not evidence that the user's permission grant failed. Both Search Console and
Analytics Admin APIs are disabled in Cloud project `918933062318`. Enable Analytics
Data API as well for report queries. No Search Console/Analytics report findings
are claimed yet; the numeric GA4 property can be discovered after API activation.

Prepared frontend implementation (not deployed): basic consent mode; optional
accept/decline controls with persistent preferences and withdrawal; tag loaded
only after consent; advertising consent remains denied; independent subdomain
cookies; URL queries/referrers and form contents excluded; product identifiers
and paths only. Events: page_view, request_quote_click, phone_click, email_click,
whatsapp_click, generate_lead. Lead events fire only after saved success receipts,
with local receipt replay deduplication. Clicks are not completed calls/delivery.

Validation: Docker production build, type check and lint pass; 119 frontend tests
pass. Local mobile browser tests mock the Google tag and enquiry endpoints:
no tag request before consent or after a declined/reloaded choice, one tag load
after acceptance, conversion events once per action, no lead event on controlled
503, one after controlled 201, no private test sentinel in event payloads,
withdrawal disables collection and clears this subdomain's Analytics cookies.
No actual Analytics hits or production enquiries were sent by these tests.

Public tag configuration fetched from Google's gtag.js endpoint confirms
`vtp_enableHistoryEvents`, `vtp_enableForm`, `vtp_enablePageView` are true.
It also has automatic user-data detection capabilities enabled. This is not proof
that customer information has already been transmitted (the chemical site has
not loaded this tag). Before activation, the owner must disable Enhanced
measurement and Google tag Allow user-provided data capabilities. These are
property/tag settings; Viewer permission cannot edit them. Site code is staged
until these settings are verified, so the original requirements of non-duplicated
tracking and no customer data transmission remain protected.

Validated image: `noks-analytics-ready-frontend:20261009`. Current production and
the `noks-chemical-frontend` build tag remain the preceding deployed release.
Pre-Analytics rollback image: `noks-pre-analytics-frontend:20261009`.
The local-only preview container was removed. Backend, database and other sites
were unchanged by this follow-up. Original dirty build-info was preserved.

After the owner confirms settings, re-fetch public tag configuration, verify the
APIs and property permissions, tag the validated image as noks-chemical-frontend,
deploy only frontend with `--no-deps --no-build`, and repeat live browser tests with
Google collection intercepted. Then check real consented traffic in Realtime and
mark generate_lead as a key event in the owner's Analytics property.

## Recheck after owner confirmation

The owner reported APIs enabled and both settings off. Fresh read-only checks:
Analytics Admin API HTTP 200, but accountSummaries exposes no properties to this
service account. Numeric property ID and Viewer permission are still needed.
Search Console remains HTTP 403 SERVICE_DISABLED for project 918933062318.
The Google tag now has user-data capabilities `vtp_isEnabled:false` (verified).

Enhanced measurement is not yet confirmed off. A fresh downloaded actual Google
tag executed in a local browser with **all collection requests intercepted**
still emits `form_start` and includes the test query marker in automatic form
metadata. No customer data or test hit was transmitted to Google. The site code's
curated events exclude queries and form contents; the remote automatic behavior
must be disabled before activation. This test is stronger evidence than tag flag
inspection alone, and deployment remains staged pending the remote correction.
The local preview is removed after testing. Current production remains healthy
and unchanged; no Search Console findings or Analytics reports are claimed.

## Owner redirected work to SEO

The later SEO-only release includes newer source changes and leaves Analytics
behind a disabled NEXT_PUBLIC_ANALYTICS_ENABLED flag. Do not deploy the old
`noks-analytics-ready-frontend:20261009` image: that would remove later SEO fixes.
Any future activation must rebuild the current source after verifying settings.
