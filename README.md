# Ahmad Ansar Portfolio

Source code for my personal portfolio.

[View the live site](https://ahmadansar.me)

I am a cybersecurity student at Wentworth Institute of Technology building toward security engineering through Linux, networking, and hands-on lab work. The site includes selected projects, experience, education, and a browser-based password strength estimator.

The site uses plain HTML, CSS, and JavaScript with no framework or build dependency. Password input is analyzed only in the browser and is not logged, stored, or sent by the site code.

## Security and privacy

- Cloudflare Pages applies the security policy in `_headers`, including a restrictive Content Security Policy, frame protection, referrer controls, and a limited Permissions Policy.
- The password estimator has no network request, storage, logging, or analytics code.
- The site uses no external fonts, contact form, advertising script, or third-party tracker.
- The public résumé excludes Ahmad's phone number and private address information.
- Security contact information is available at [`/.well-known/security.txt`](https://ahmadansar.me/.well-known/security.txt).
