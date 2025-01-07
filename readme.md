# Personal Website

A website with stuff I made and info about me. Check it out at [https://mbabbott.com](https://mbabbott.com)

## Links

- View [my resume](https://mbabbott.com/resume.pdf)
- View [my Github](https://github.com/matthewabbott) (You are here)
- View [my LinkedIn](https://www.linkedin.com/in/matthew-abbott-88390065/)
- [Email Me](mailto:ttobbatam+website@gmail.com)

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
  - Make this work on mobile
  - Add a rules popup to the left sidebar
  - Add the option to vary the number of rounds
  - Add ability to view previous tricks
  - Add ability to rearrange cards in hand and sort hand
- Been thinking about training AI agents to play the game, but that's a future ambition for now.

## Technologies Used
- HTML5
- CSS3
- Vanilla JavaScript
- No external dependencies (yet), except that google font I used.

## File Structure
- `index.html` - Main personal webpage
- `oh-hell.html` - Oh Hell card game page
- `js/cardDeck/*` - Card toy physics engine implementation
- `js/ohHell/*` - Oh Hell game logic