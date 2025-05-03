# London Permacomputing Club site

A site to keep projects, notes, thoughts and club updates about permacomputing.

## Features

-   Pulls content from any public or private Are.na channel (with API token)
-   Simple HTML pages for each block
-   Navigation between all blocks
    Saves slug mappings to enable efficient rebuilds
-   Homepage displaying all posts in reverse chronological order
-   Tags for creating connections between posts
-   Supports Text, Image, and Link block types
-   Markdown support for text content
-   Static site generation for easy hosting and minimal resource usage

## Setup

1. Clone this repository
2. Create a `.env` file in the root directory with:
   `envARENA_ACCESS_TOKEN=your_arena_token_here`
   `CHANNEL_SLUG=your_arena_channel_slug`

## Usage

1. `npm install`
   This installs:
    - `are.na` - Are.na API client
    - `dotenv` - Environment variable management
    - `marked` - Markdown parsing
    - `ts-node` - TypeScript execution
    - `rimraf` - Cross-platform directory removal
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

your-project/
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
│ └── main.js # Client-side JavaScript (tags)
├── views/ # HTML templates
│ ├── layouts/
│ │ └── main.html # Main layout template
│ ├── pages/
│ │ ├── home.html # Home page template
│ │ └── item.html # Individual item template
│ └── partials/
│ └── navigation.html # Navigation partial
├── utils/ # Shared utilities
│ ├── file.ts # Directory logic
│ └── index.ts # Markdown rendering, custom functionality
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

## How It Works

### Template System:

Uses a simple custom template engine with variable substitution
Supports partials with `{{> partial_name}}` syntax
Variables use `{{ variable_name }}` syntax

### File Organisation:

`layouts`: Contains the main page structure (header, footer)
`pages`: Contains the specific content for each page type
`partials`: Contains reusable components like navigation

### Styling:

CSS is completely separate in the `public/css` directory
Additional stylesheets can be added and linked as needed

### Client-side JavaScript:

Separate JS file for any browser functionality
Loaded at the bottom of the page for better performance

### Content Rendering:

Text content is rendered as Markdown for rich formatting
Link descriptions also support Markdown formatting
Images and other content types are rendered appropriately

## Customisation

You can easily modify:

The HTML structure by editing template files
The styling by editing CSS files
Add interactive features by updating the JavaScript file

### Adding packages

If you want to add any additional packages, you can:
`npm install package-name --save`
And for development dependencies:
`npm install package-name --save-dev`
