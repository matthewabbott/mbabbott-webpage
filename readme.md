# Personal Website

A website with stuff I made and info about me. Check it out at [https://mbabbott.com](https://mbabbott.com)

## Links

- View [my resume](https://mbabbott.com/resume.pdf)
- View [my Github](https://github.com/matthewabbott) (You are here)
- View [my LinkedIn](https://www.linkedin.com/in/matthew-abbott-88390065/)
- [Email Me](mailto:ttobbatam+website@gmail.com)

## Projects

- Personal Knowledge Base: https://github.com/matthewabbott/personal-kb
  - React + Typescript
- Embedded Semantic Search: https://github.com/matthewabbott/embedded-semantic
  - Svelte + Rust

## Games & Interactive Elements

### Cards on the homepage
- Click the deck to spawn new cards
- Drag cards around the screen
- Vanilla javascript implementation (the 'physics' are bespoke)
- Try it on mobile too!
- TODOs
  - Allow dragging off the top of the deck
  - Add physics options to give people the ability to make things more slidey as they desire
  - Deck depletion behavior (right now you can draw duplicates)
    - Have 'clear cards' instead be 'reshuffle' and suck in all drawn cards
  - Get rid of the invisible box on the homepage

### Oh Hell Card Game
- Play 'Oh Hell!' (Also known as 'contract whist', [https://en.wikipedia.org/wiki/Oh_hell](https://en.wikipedia.org/wiki/Oh_hell))
- Also a vanilla javascript implementation
- TODOs
  - Add a rules popup to the left sidebar
  - Add the option to vary the number of rounds
  - Add ability to view previous tricks
  - Add ability to rearrange cards in hand and sort hand
  - Grey out cards that are illegal to play. (Make it so you can't pick them up?)
  
  - Mobile: make game container a little bigger? Or allow zooming out
  - Mobile: make game info dropdown more obvious
- Been thinking about training AI agents to play the game, but that's a future ambition for now.

## Technologies Used
- HTML5
- CSS3
- JavaScript
- Marked.js (for rendering GitHub READMEs)

## How Deployment Works

This is pretty simple. The source files live in `~/mbabbott-webpage/var/www/html/`, and I deploy by copying them to `/var/www/html/` where nginx serves them.

### Deploying the Main Site

```bash
# Make your changes in ~/mbabbott-webpage/var/www/html/
# Then deploy:
sudo cp -r ~/mbabbott-webpage/var/www/html/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

# Commit your changes
cd ~/mbabbott-webpage
git add .
git commit -m "your message here"
```

### Deploying the Resume

```bash
sudo cp ~/mbabbott-webpage/var/www/html/resume.pdf /var/www/html/resume.pdf
```

### Server Setup

The site runs on a VPS with:
- **nginx** serving static files from `/var/www/html/`
- **PM2** managing backend servers for interactive apps:
  - personal-kb server on port 3001
  - dice-roller server on port 4000
- **Let's Encrypt** for SSL

nginx config lives at `/etc/nginx/sites-available/default` and handles:
- Static files for the main site
- Proxying API requests to PM2-managed servers
- Sub-apps at `/dice/`, `/personal-kb/`, `/semantic-search/`, etc.

For detailed deployment steps for specific apps, see:
- `_dice-roller_deployment_steps.md` for the dice roller app

### Featured Section

The homepage Featured section dynamically loads README content from GitHub repos. To change what's featured, edit the `repo` variable in the `loadFeaturedReadme()` function in `index.html`:

```javascript
const repo = 'matthewabbott/terrarium-agent';  // Change this to feature a different repo
```

The system is set up to make rotating featured projects easy in the future.
