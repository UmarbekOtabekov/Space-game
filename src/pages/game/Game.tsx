
import { useEffect, useRef, useState } from "react";
import "./Game.css";

import playerImage from "../../assets/player.png";
import enemyImage from "../../assets/enemy.png";
import bulletImage from "../../assets/bullet.png";

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 600;

    const player = {
      x: 425,
      y: 500,
      width: 50,
      height: 50,
      speed: 5,
    };

    const playerImg = new Image();
    playerImg.src = playerImage;

    const enemyImg = new Image();
    enemyImg.src = enemyImage;

    const bulletImg = new Image();
    bulletImg.src = bulletImage;

    const keys: Record<string, boolean> = {};
    let gameOver = false;

    const keyDown = (event: KeyboardEvent) => {
      keys[event.key.toLowerCase()] = true;

      if (
        event.key.toLowerCase() === "r" &&
        gameOver &&
        socketRef.current?.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({
            type: "restart",
          }),
        );

        gameOver = false;
      }
    };

    const keyUp = (event: KeyboardEvent) => {
      keys[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "game_state") {
        const game = message.data;

        setHp(game.player.hp);
        setScore(game.player.score);

        gameOver = game.game_over;

        drawGame(
          ctx,
          canvas,
          game,
          playerImg,
          enemyImg,
          bulletImg,
        );
      }
    };

    socket.onerror = () => {
      setConnected(false);
    };

    socket.onclose = () => {
      setConnected(false);
    };

    const sendMovement = () => {
      if (gameOver) return;

      let x = player.x;
      let y = player.y;

      if (keys["a"] || keys["arrowleft"]) {
        x -= player.speed;
      }

      if (keys["d"] || keys["arrowright"]) {
        x += player.speed;
      }

      if (keys["w"] || keys["arrowup"]) {
        y -= player.speed;
      }

      if (keys["s"] || keys["arrowdown"]) {
        y += player.speed;
      }

      x = Math.max(0, Math.min(850, x));
      y = Math.max(0, Math.min(550, y));

      player.x = x;
      player.y = y;

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "move",
            x,
            y,
          }),
        );
      }
    };

    const movementInterval = setInterval(
      sendMovement,
      1000 / 60,
    );

    const shoot = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !gameOver &&
        socket.readyState === WebSocket.OPEN
      ) {
        socket.send(
          JSON.stringify({
            type: "shoot",
          }),
        );
      }
    };

    window.addEventListener("keydown", shoot);

    return () => {
      clearInterval(movementInterval);

      socket.close();

      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("keydown", shoot);
    };
  }, []);

  return (
    <div className="game">
      <div className="hud">
        <span>❤️ HP: {hp}</span>

        <span>🏆 Score: {score}</span>

        <span>
          {connected
            ? "🟢 Connected"
            : "🔴 Disconnected"}
        </span>
      </div>

      <canvas ref={canvasRef} />
    </div>
  );
}

function drawGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  game: {
    player: {
      x: number;
      y: number;
    };

    bullets: {
      x: number;
      y: number;
    }[];

    enemies: {
      x: number;
      y: number;
    }[];

    game_over: boolean;
  },
  playerImg: HTMLImageElement,
  enemyImg: HTMLImageElement,
  bulletImg: HTMLImageElement,
) {
  ctx.fillStyle = "#050816";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  ctx.fillStyle = "white";

  for (let i = 0; i < 80; i++) {
    const x = (i * 137) % canvas.width;
    const y = (i * 73) % canvas.height;

    ctx.fillRect(x, y, 2, 2);
  }

  if (!game.game_over) {
    ctx.drawImage(
      playerImg,
      game.player.x,
      game.player.y,
      50,
      50,
    );
  }

  for (const bullet of game.bullets) {
    ctx.drawImage(
      bulletImg,
      bullet.x - 5,
      bullet.y,
      15,
      25,
    );
  }

  for (const enemy of game.enemies) {
    ctx.drawImage(
      enemyImg,
      enemy.x,
      enemy.y,
      50,
      50,
    );
  }

  if (game.game_over) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "red";
    ctx.font = "bold 70px Arial";

    ctx.fillText(
      "GAME OVER",
      canvas.width / 2,
      canvas.height / 2 - 20,
    );

    ctx.fillStyle = "white";
    ctx.font = "bold 28px Arial";

    ctx.fillText(
      "Press R to Restart",
      canvas.width / 2,
      canvas.height / 2 + 40,
    );
  }
}

export default Game;
