const http = require("http");
const fs = require("fs");

const { Player } = require("./game/class/player");
const { World } = require("./game/class/world");
const { redirectToHomePage, actionsSwitcher } = require("./helpers/helpers");
const worldData = require("./game/data/basic-world-data");
const { log } = require("console");

const methods = {
  POST: "POST",
  GET: "GET",
};
const exits = { east: "e", west: "w", south: "s", north: "n" };
const possibleExits = ["north", "east", "west", "south"];
const possibleActions = ["eat", "drop", "take"];
let player;
let world = new World();
world.loadWorld(worldData);

const server = http.createServer((req, res) => {
  /* ==============  GET THE CSS ASSET ============= */
  if (req.method === methods.GET && req.url.startsWith("/assets")) {
    try {
      const assetPath = req.url.split("/assets")[1];
      const asset = fs.readFileSync("./assets" + assetPath);
      res.statusCode = 200;
      res.setHeader("Content-type", "text/css");
      res.write(asset);
      return res.end();
    } catch (error) {
      log(error);
    }
  }
  /* ============== ASSEMBLE THE REQUEST BODY AS A STRING =============== */
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => {
    // After the assembly of the request body is finished
    /* ==================== PARSE THE REQUEST BODY ====================== */
    if (reqBody) {
      req.body = reqBody
        .split("&")
        .map((keyValuePair) => keyValuePair.split("="))
        .map(([key, value]) => [key, value.replace(/\+/g, " ")])
        .map(([key, value]) => [key, decodeURIComponent(value)])
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    }

    /* ======================== ROUTE HANDLERS ========================== */
    const { method, url } = req;

    // Phase 1: GET /
    if (method === methods.GET && url === "/") {
      const htmlPage = fs.readFileSync("./views/new-player.html", "utf-8");
      const resBody = htmlPage.replace(
        /#{availableRooms}/g,
        world.availableRoomsToString()
      );

      res.statusCode = 200;
      res.setHeader("Content-type", "text/html");
      res.write(resBody);
      return res.end();
    }

    // Phase 2: POST /player
    if (method === methods.POST && url === "/player") {
      const { name, roomId } = req.body;
      const playerStartingRoom = world.rooms[roomId];

      if (name && playerStartingRoom) {
        player = new Player(name, playerStartingRoom);
      } else {
        return res.end("Not a valid player name or room");
      }

      res.statusCode = 201;
      res.statusCode = 302;
      res.setHeader("Location", `/rooms/${roomId}`);
      return res.end();
    }
    // Phase 3: GET /rooms/:roomId
    if (method === methods.GET && url.startsWith("/rooms")) {
      const urlSplit = url.split("/");
      const roomId = urlSplit.at(-1);
      if (!isNaN(roomId)) {
        const room = world.rooms[roomId];
        const htmlPage = fs.readFileSync("./views/room.html", "utf-8");
        const resBody = htmlPage
          .replace(/#{roomName}/g, room.name)
          .replace(/#{roomId/g, roomId)
          .replace(/#{roomItems}/g, room.itemsToString())
          .replace(/#{inventory}/g, player.inventoryToString())
          .replace(/#{exits}/g, room.exitsToString());

        res.statusCode = 200;
        res.setHeader("Content-type", "text/html");
        res.write(resBody);
        return res.end();
      }
    }
    // Phase 4: GET /rooms/:roomId/:direction
    if (method === methods.GET && url.startsWith("/rooms")) {
      const urlSplit = url.split("/");

      const exitCoordinate = urlSplit[3];

      if (urlSplit.length === 4 && possibleExits.includes(exitCoordinate)) {
        const roomId = urlSplit[2];
        const room = world.rooms[roomId];
        try {
          if (player.currentRoom.id !== room.id) {
            throw new Error("This room is not player current room");
          }
          player.move(exits[exitCoordinate]);
          const currentRoom = player.currentRoom;

          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${currentRoom.id}`);
          return res.end();
        } catch (error) {
          console.log(error);
          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${roomId}`);
          return res.end();
        }
      }
      return res.end("unavailable exit");
    }
    // Phase 5: POST /items/:itemId/:action
    if (method === methods.POST && url.startsWith("/items")) {
      const urlSplit = url.split("/");
      const action = urlSplit[3];
      if (urlSplit.length === 4 && possibleActions.includes(action)) {
        try {
          const itemId = urlSplit[2];

          actionsSwitcher(action, player, itemId);
          const currentRoom = player.currentRoom;
          res.statusCode = 302;
          res.setHeader("Location", `/rooms/${currentRoom.id}`);
          return res.end();
        } catch (error) {
          log(error);
        }
      }
    }

    // Phase 6: Redirect if no matching route handlers
  });
});

const port = 5000;

server.listen(port, () => console.log("Server is listening on port", port));
