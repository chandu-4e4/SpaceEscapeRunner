# Space Escape Runner

A React Native + Expo arcade game where you pilot a spaceship, dodge falling asteroids, and rack up points before you crash.

## How to Run This Project

### Prerequisites
- Node.js (v18 or later)
- Expo Go app installed on your phone (iOS or Android)
- Your phone and computer connected to the same Wi-Fi network

### Steps

1. Clone the repository

    git clone https://github.com/chandu-4e4/SpaceEscapeRunner.git
    cd SpaceEscapeRunner

2. Install dependencies

    npm install

3. Start the development server

    npx expo start

4. Open on your phone
- A QR code will appear in your terminal.
- Android: open the Expo Go app and use its built-in QR scanner.
- iOS: open the Camera app and point it at the QR code.
- The game will load inside Expo Go within a few seconds.

## Gameplay

- Tap Start Game to begin.
- Use the Move Left and Move Right buttons to dodge falling asteroids.
- Your score increases each time an asteroid passes safely.
- Colliding with an asteroid ends the game and shows your final score.
- Your high score is saved automatically and persists between sessions.

## Tech Stack

- Expo (SDK 54)
- React Native
- Expo Router (file-based navigation)
- AsyncStorage (for persisting high scores)
- TypeScript
