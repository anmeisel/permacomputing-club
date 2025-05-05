# London Permacomputing Club Website

A site to keep club updates, projects, notes and thoughts about permacomputing.

## Features

-   Pulls content from closed Are.na channel via API token. CMS: https://www.are.na/london-permacomputing-club/permacomputing-club
-   Simple HTML pages for each block
-   Saves slug mappings to enable efficient rebuilds
-   Homepage displaying all posts in reverse chronological order
-   Tags for creating connections between posts
-   Supports Text, Image, and Link block types
-   Markdown support for text content
-   Static site generation for easy hosting and minimal resource usage
-   Page size measuring of the static build

## Setup

1. Clone this repository
2. Create a `.env` file in the root directory with:
    - `ARENA_ACCESS_TOKEN=arena_api_token`
    - `CHANNEL_SLUG=arena_channel_slug`
    - Contact @anmeisel for these variables

## Usage

1. `npm install`
   This installs:
    - `are.na` - Are.na API client
    - `dotenv` - Environment variable management
    - `marked` - Markdown parsing
    - `ts-node` - TypeScript execution
    - `rimraf` - Cross-platform directory removal
    - `jsdom` - Parses HTML to measure page size
    - `vercel` - Deployment and hosting
2. `npm run build:preview` - Build and preview in one step

### Scripts

-   `npm run build` - Build the static site
-   `npm run preview` - Serve the static site locally and open in browser
-   `npm run build:preview` - Build and then immediately preview the site
-   `npm run clean` - Remove build and dist directories

## Technical Details

-   Uses Are.na: https://www.are.na/london-permacomputing-club/channels
-   HTML, CSS, TypeScript, Node
-   Markdown rendering for richer text content

## Credits

Some styling was used from [Elliott Cost's Memory Site](https://sites.elliott.computer/html-templates) which was inspired by [Piper Haywood](https://piperhaywood.com) and [Zinzy Waleson Geene](https://www.zinzy.website) websites.

## Project Structure

```
permacomputing-club/
│
├── .github/ # GitHub Actions scripts + workflows
├── .vscode/ # VS Code configuration
├── build/ # Static HTML from build script
├── types/ # TypeScript type definitions
│ ├── are.na.d.ts
│ ├── arena-types.ts # Content type definitions
│ └── paths.ts # Generated path definitions
├── public/ # Publicly accessible files
│ ├── css/
│ │ └── style.css # Main stylesheet
│ └── js/
│   └── main.js # Client-side JavaScript (tags)
├── views/ # HTML templates
│ ├── layouts/
│ │ └── main.html # Main layout template
│ └── pages/
│   ├──home.html # Home page template
│   └── item.html # Individual item template
├── utils/ # Shared utilities
│ ├── file.ts # Directory logic
│ ├── index.ts # Markdown rendering, custom functionality
│ └── size.ts # Page size measuring
├── scripts/ # Server-side scripts
│ ├── arena.ts # Fetches are.na content
│ ├── slug.ts # Maps slugs
│ └── template.ts # Renders templates
├── .editorconfig
├── .env # Environment variables
├── .gitignore
├── build.ts # Static site generator
├── index.ts # Entry template logic
├── README.md
└── tsconfig.json
```

## How It Works

### Template System & Content Rendering:

Uses a simple custom templating function called `renderTemplate` (`scripts/template.ts`) with variable substitution. Here we render content into the `views` templates.

-   Supports partials with `{{> partial_name}}` syntax
-   Variables use `{{ variable_name }}` syntax
-   Text content is rendered as Markdown for rich formatting
-   Link descriptions also support Markdown formatting
-   Images and other content types are rendered appropriately

### File Organisation:

`layouts`: Contains the main page structure (header, footer)

`pages`: Contains the specific content for each page type

### Styling:

CSS is completely separate in the `public/css` directory. Additional stylesheets can be added and linked as needed.

### Client-side JavaScript:

Separate JS files are in the `public/js` directory for any browser functionality.

## Customisation

You can easily modify:

-   The HTML structure by editing template files
-   The styling by editing CSS files
-   Add interactive features by updating the JavaScript file
-   Please discuss any proposed improvements or additions that go beyond basic styling or client-side functionality with the rest of the group before proceeding

### Adding packages

If you want to add any additional packages, you can:

`npm install package-name --save`

And for development dependencies:

`npm install package-name --save-dev`

## GitHub Actions, Are.na Polling & Vercel Deploy

The site uses a GitHub Actions workflow to automatically check for new content on the Are.na channel every 10 minutes. This is done by polling the Are.na API using your `ARENA_ACCESS_TOKEN` and `CHANNEL_SLUG`.

When a change is detected (such as a new block being added - currently there is no check for block edits), the workflow triggers a Vercel Deploy Hook via a POST request. This tells Vercel to rebuild the static site using the latest Are.na content. No need to push a Git commit for updates to appear online.

Secrets like the API token and deploy hook URL are securely stored in the GitHub repository’s Actions Secrets.

**Please push mindfully.**
Our Vercel project is connected to this repository, so every time you make a push to the `main` branch, the website will redeploy. Please contact @anmeisel if you would like to be added to the Vercel project.

## Future Improvements

This roadmap is a living document meant to evolve with our collective knowledge and priorities. If you have ideas that match [permacomputing principles](https://permacomputing.net/Principles/) or technical improvements to suggest, please:

-   Share your thoughts during club meetings
-   Submit proposals via pull requests
-   Add notes to the following points in this README
-   Experiment with implementations and share your findings

### Infrastructure & Hosting

-   Migrate to self-hosted local server infrastructure to reduce dependency on cloud services
-   Implement low-power computing strategies. For example, Vercel triggers a deploy per repo push, which is not ecological
-   Explore offline-first functionality using Service Workers
-   Investigate peer-to-peer content sharing

### Content Management

1. Enhance `.github/scripts/poll-arena.js` to detect changes in block content, not just block count
2. Transition from Are.na to decentralised content networks:
    - Integrate with ActivityPub/Fediverse (Mastodon API) for federated content sharing
    - Explore distributed content storage
    - Consider implementing a simple git-based CMS for version control and offline editing

### Media Handling

-   Create a script that automatically dithers all images to reduce file size and energy consumption
-   Implement responsive image loading with multiple resolutions based on device capabilities
-   Add WebP/AVIF conversion with fallbacks for broader compatibility

### Performance & Accessibility

1. Double check `utils/size.ts` to ensure accurate page size measurement
2. Implement accessibility testing:
    - Manual keyboard navigation testing
    - Screen reader compatibility verification
    - Color contrast analysis (WCAG 2.1 Level AA Standards)
3. Add a "low-bandwidth mode" toggle that loads text-only version

### Documentation & Community

-   Document the carbon footprint of the website and accessibility audits
-   Create community contribution guidelines
-   Develop a template version others can easily fork and customise
