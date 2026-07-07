import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHIP_WIDTH = 60;
const SHIP_HEIGHT = 70;
const SHIP_BOTTOM_OFFSET = 140;
const MOVE_STEP = 30;
const ASTEROID_SIZE = 40;
const ASTEROID_SPEED = 8;
const GAME_TICK_MS = 50;
const HIGH_SCORE_KEY = 'SPACE_ESCAPE_HIGH_SCORE';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHIP_START_X = (SCREEN_WIDTH - SHIP_WIDTH) / 2;

export default function Index() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [shipX, setShipX] = useState(SHIP_START_X);
  const [asteroidX, setAsteroidX] = useState(0);
  const [asteroidY, setAsteroidY] = useState(0);

  const shipXRef = useRef(shipX);
  const asteroidXRef = useRef(asteroidX);
  const asteroidYRef = useRef(asteroidY);

  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shipMoveAnim = useRef(new Animated.Value(SHIP_START_X)).current;

  useEffect(() => {
    shipXRef.current = shipX;
  }, [shipX]);

  useEffect(() => {
    asteroidXRef.current = asteroidX;
    asteroidYRef.current = asteroidY;
  }, [asteroidX, asteroidY]);

  // Animate the ship sliding smoothly to its new position, instead of jumping instantly
  useEffect(() => {
    Animated.timing(shipMoveAnim, {
      toValue: shipX,
      duration: 150,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [shipX]);

  // Pulsing engine glow, looping forever
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  // Slowly spinning asteroid, looping forever
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (savedValue !== null) {
          setHighScore(parseInt(savedValue, 10));
        }
      } catch (error) {
        console.log('Failed to load high score:', error);
      }
    };
    loadHighScore();
  }, []);

  const saveHighScoreIfNeeded = async (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        await AsyncStorage.setItem(HIGH_SCORE_KEY, finalScore.toString());
      } catch (error) {
        console.log('Failed to save high score:', error);
      }
    }
  };

  const spawnAsteroid = () => {
    const randomX = Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE);
    setAsteroidX(randomX);
    setAsteroidY(0);
  };

  const handleStartGame = () => {
    setScore(0);
    setIsGameOver(false);
    setShipX(SHIP_START_X);
    shipMoveAnim.setValue(SHIP_START_X);
    spawnAsteroid();
    setIsPlaying(true);
  };

  const moveLeft = () => {
    setShipX((prevX) => Math.max(prevX - MOVE_STEP, 0));
  };

  const moveRight = () => {
    setShipX((prevX) => Math.min(prevX + MOVE_STEP, SCREEN_WIDTH - SHIP_WIDTH));
  };

  const checkCollision = () => {
    const shipTop = SCREEN_HEIGHT - SHIP_BOTTOM_OFFSET - SHIP_HEIGHT;
    const shipLeft = shipXRef.current;
    const shipRight = shipLeft + SHIP_WIDTH;
    const shipBottom = shipTop + SHIP_HEIGHT;

    const astLeft = asteroidXRef.current;
    const astRight = astLeft + ASTEROID_SIZE;
    const astTop = asteroidYRef.current;
    const astBottom = astTop + ASTEROID_SIZE;

    const horizontalOverlap = shipLeft < astRight && shipRight > astLeft;
    const verticalOverlap = shipTop < astBottom && shipBottom > astTop;

    return horizontalOverlap && verticalOverlap;
  };

  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      const newY = asteroidYRef.current + ASTEROID_SPEED;

      if (checkCollision()) {
        setIsPlaying(false);
        setIsGameOver(true);
        setScore((currentScore) => {
          saveHighScoreIfNeeded(currentScore);
          return currentScore;
        });
        return;
      }

      if (newY > SCREEN_HEIGHT) {
        spawnAsteroid();
        setScore((prevScore) => prevScore + 1);
      } else {
        setAsteroidY(newY);
      }
    }, GAME_TICK_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying]);

  return (
    <LinearGradient
      colors={['#0B0E23', '#1A1040', '#0B0E23']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Space Escape Runner</Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>HIGH SCORE</Text>
          <Text style={styles.scoreValue}>{highScore}</Text>
        </View>
      </View>

      {!isPlaying && !isGameOver && (
        <TouchableOpacity style={styles.button} onPress={handleStartGame} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      {isGameOver && (
        <View style={styles.gameOverBox}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
          <Text style={styles.finalScoreText}>High Score: {highScore}</Text>
          <TouchableOpacity style={styles.button} onPress={handleStartGame} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPlaying && (
        <Animated.View
          style={[
            styles.asteroid,
            { left: asteroidX, top: asteroidY, transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <View style={styles.craterOne} />
          <View style={styles.craterTwo} />
        </Animated.View>
      )}

      <Animated.View style={[styles.spaceship, { left: shipMoveAnim }]}>
        <View style={styles.shipNose} />
        <View style={styles.shipBody}>
          <View style={styles.cockpit} />
        </View>
        <Animated.View style={[styles.shipEngineGlow, { opacity: glowAnim }]} />
      </Animated.View>

      {isPlaying && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={moveLeft} activeOpacity={0.7}>
            <Text style={styles.controlButtonText}>⬅ Move Left</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={moveRight} activeOpacity={0.7}>
            <Text style={styles.controlButtonText}>Move Right ➡</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#00E5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 50,
  },
  scoreBox: {
    backgroundColor: 'rgba(26, 31, 61, 0.8)',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  scoreLabel: {
    fontSize: 13,
    color: '#8A8FC7',
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#00E5FF',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B0E23',
  },
  spaceship: {
    position: 'absolute',
    bottom: 140,
    width: 60,
    height: 70,
    alignItems: 'center',
  },
  shipNose: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#00E5FF',
  },
  shipBody: {
    width: 40,
    height: 35,
    backgroundColor: '#4ADEDE',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cockpit: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0B0E23',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shipEngineGlow: {
    width: 20,
    height: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    marginTop: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  asteroid: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#8B5E3C',
    borderWidth: 2,
    borderColor: '#5C3D26',
  },
  craterOne: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C3D26',
    top: 6,
    left: 8,
  },
  craterTwo: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5C3D26',
    bottom: 8,
    right: 6,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
  },
  controlButton: {
    backgroundColor: 'rgba(26, 31, 61, 0.9)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  gameOverBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 31, 61, 0.95)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 10,
  },
  finalScoreText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 6,
  },
});
