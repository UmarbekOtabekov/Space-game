import asyncio
import random

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Space Shooter Backend ishlayapti!"}


class Player:
    def __init__(self):
        self.x = 425
        self.y = 500
        self.width = 50
        self.height = 50
        self.hp = 3
        self.score = 0

    def move(self, x, y):
        self.x = max(0, min(850, x))
        self.y = max(0, min(550, y))

    def shoot(self):
        return Bullet(self.x + 23, self.y)


class Bullet:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 5
        self.height = 15
        self.speed = 8

    def update(self):
        self.y -= self.speed


class Enemy:
    def __init__(self):
        self.x = random.randint(0, 850)
        self.y = -50
        self.width = 50
        self.height = 50
        self.speed = random.randint(2, 5)

    def update(self):
        self.y += self.speed


class Game:
    def __init__(self):
        self.player = Player()
        self.bullets = []
        self.enemies = []
        self.spawn_timer = 0
        self.game_over = False

    def restart(self):
        self.player = Player()
        self.bullets = []
        self.enemies = []
        self.spawn_timer = 0
        self.game_over = False

    def update(self):
        if self.game_over:
            return

        for bullet in self.bullets:
            bullet.update()

        for enemy in self.enemies:
            enemy.update()

        self.spawn_timer += 1

        if self.spawn_timer >= 40:
            self.enemies.append(Enemy())
            self.spawn_timer = 0

        self.bullets = [
            bullet
            for bullet in self.bullets
            if bullet.y > -20
        ]

        self.enemies = [
            enemy
            for enemy in self.enemies
            if enemy.y < 620
        ]

        for bullet in self.bullets[:]:
            for enemy in self.enemies[:]:
                if self.collision(bullet, enemy):
                    if bullet in self.bullets:
                        self.bullets.remove(bullet)

                    if enemy in self.enemies:
                        self.enemies.remove(enemy)

                    self.player.score += 10
                    break

        for enemy in self.enemies[:]:
            if self.collision(self.player, enemy):
                self.enemies.remove(enemy)
                self.player.hp -= 1

                if self.player.hp <= 0:
                    self.player.hp = 0
                    self.game_over = True

    @staticmethod
    def collision(a, b):
        return (
            a.x < b.x + b.width
            and a.x + a.width > b.x
            and a.y < b.y + b.height
            and a.y + a.height > b.y
        )

    def get_state(self):
        return {
            "player": {
                "x": self.player.x,
                "y": self.player.y,
                "hp": self.player.hp,
                "score": self.player.score,
            },
            "bullets": [
                {
                    "x": bullet.x,
                    "y": bullet.y,
                }
                for bullet in self.bullets
            ],
            "enemies": [
                {
                    "x": enemy.x,
                    "y": enemy.y,
                }
                for enemy in self.enemies
            ],
            "game_over": self.game_over,
        }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    game = Game()

    async def game_loop():
        while True:
            game.update()

            await websocket.send_json({
                "type": "game_state",
                "data": game.get_state(),
            })

            await asyncio.sleep(1 / 60)

    loop_task = asyncio.create_task(game_loop())

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "move":
                if not game.game_over:
                    game.player.move(
                        data["x"],
                        data["y"],
                    )

            elif data.get("type") == "shoot":
                if not game.game_over:
                    game.bullets.append(
                        game.player.shoot()
                    )

            elif data.get("type") == "restart":
                game.restart()

    except WebSocketDisconnect:
        loop_task.cancel()
        print("Player disconnected")