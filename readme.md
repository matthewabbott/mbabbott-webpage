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
  - Add physics options to give people the ability to make things more slidey as they desire
  - Deck depletion behavior (right now you can draw duplicates)
    - Have 'clear cards' instead be 'reshuffle' and suck in all drawn cards

### Oh Hell Card Game
- Play 'Oh Hell!' (Also known as 'contract whist', [https://en.wikipedia.org/wiki/Oh_hell](https://en.wikipedia.org/wiki/Oh_hell))
- Also a vanilla javascript implementation
- TODOs
  - Make this work on mobile
  - Scoring needs to count tricks even if you miss your bid
  - I ran into a crash somewhere but haven't been able to track it down again
  - The dealer pin isn't properly passed around. I've tracked this to the bidding logic but not sure what about it is wrong. 
  - Make this less of a monolith (it's become quite cumbersome)
  - Add a rules popup to the left sidebar
  - Add the option to vary the number of rounds
- Been thinking about training AI agents to play the game, but that's a future ambition for now.

## Technologies Used
- HTML5
- CSS3
- Vanilla JavaScript
- No external dependencies (yet), except that google font I used.

## File Structure
- `index.html` - Main personal webpage
- `oh-hell.html` - Oh Hell card game page
- `js/cardDeck.js` - Card toy physics engine implementation
- `js/ohHell.js` - Oh Hell game logic