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
    - Contact ana@4us4others.com for these variables

## Usage

1. `npm install`
   This installs:
    - `are.na` - Are.na API client
    - `dotenv` - Environment variable management
    - `marked` - Markdown parsing
    - `ts-node` - TypeScript execution
    - `rimraf` - Cross-platform directory removal
    - `jsdom` - Parses HTML to measure page size
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

Inspired by Elliott Cost's Website Template Styling (https://sites.elliott.computer/html-templates): Memory site was inspired by Piper Haywood (https://piperhaywood.com) and Zinzy Waleson Geene (https://www.zinzy.website) websites.

## Project Structure

```
permacomputing-club/
│
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
