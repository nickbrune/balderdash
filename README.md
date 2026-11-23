# Balderdash '85

A 1980s game-show bluffing party game. One screen (a TV or laptop) runs the game, and everyone plays on their own phone by scanning a QR code. No accounts, no app install.

## How to play
1. Open the site on the TV or laptop everyone can see and tap **Start a game on this screen**.
2. Everyone scans the QR code with their phone camera, types a name and joins.
3. Players take turns hosting. The host spins the category wheel (word, person, initials, movie or law) and secretly sees the real answer.
4. Everyone else has 3 minutes to write a convincing fake answer. The host puts all the answers on screen, and everyone votes for the real one.
5. **+2** for finding the real answer, **+1** for every player your bluff fools, **+3** if your answer was basically right, and **+3** to the host if nobody finds it. First to 15 wins.

There's also a **▶ 1-min tutorial** and a **🛋️ Test mode** that runs a TV and several phones on one screen.

## Files
| File | What it does |
|---|---|
| `index.html` | The page |
| `game.css` | All styling, including the game-show set and holiday themes |
| `game.js` | The game: rules, screens, main screen and phone views |
| `extras.js` | Test mode and the narrated tutorial |
| `net.js` | Multiplayer (PeerJS) and narration (browser speech) |
| `cards.js` | The card bank: 595 words, people, initials, movies and laws |
| `qr.js` | QR code encoder |

## How multiplayer works
The main screen hosts the room through [PeerJS](https://peerjs.com/) (WebRTC). Each phone connects directly to the main screen; PeerJS's free public server is only used to introduce the devices to each other. The game itself runs on the main screen, so keep that tab open.

If a phone can't connect on a strict network (some office or guest Wi-Fi), switching that phone to cellular data usually fixes it.

## Credits
- QR encoder: "QRCode for JavaScript" by Kazuhiko Arase, MIT license. QR Code is a registered trademark of DENSO WAVE INCORPORATED.
- PeerJS: MIT license.
- Fonts: Bungee, Mr Dafoe, VT323 and Rubik from Google Fonts (SIL Open Font License).
