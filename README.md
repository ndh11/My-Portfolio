# Natasha Harris — Portfolio

A static, responsive personal portfolio site: product development, EdTech leadership, and skills. Styled with an editorial, warm layout (inspired by modern designer portfolios) and built with plain HTML, CSS, and JavaScript—no build step required.

## Project structure

| Path | Description |
|------|-------------|
| `index.html` | Single-page site: hero, impact, skills, experience, about, contact |
| `css/styles.css` | Layout, typography, responsive behavior, motion |
| `js/main.js` | Navigation, scroll reveals, footer year |
| `assets/my-photo.jpeg` | Headshot used in the hero |
| `My_Info.MD` | Source notes for copy and facts (optional reference) |

## Local setup

1. Clone the repository (or download the folder).
2. Serve the folder as static files—any static server works.

**Python 3**

```bash
cd "My Portfolio"
python3 -m http.server 8080
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

**Node (npx)**

```bash
cd "My Portfolio"
npx --yes serve -p 8080
```

## Deployment

This repo is static-file hosting friendly:

- **GitHub Pages**: Repository Settings → Pages → Source: deploy from branch (e.g. `main` / root).
- **Netlify / Vercel**: Connect the repo; publish directory is the repository root (same folder as `index.html`).

No environment variables or server-side code are required.

## Updating content

- Edit text and sections in `index.html`.
- Replace `assets/my-photo.jpeg` if you update your headshot (keep a similar aspect ratio for the hero frame).
- Optional: keep `My_Info.MD` in sync as a single source of notes for future edits.

## License

Personal portfolio—content © Natasha Harris unless otherwise noted.
