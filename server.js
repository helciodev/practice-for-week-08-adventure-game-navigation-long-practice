const http = require("http");
const fs = require("fs");

const { Player } = require("./game/class/player");
const { World } = require("./game/class/world");

const worldData = require("./game/data/basic-world-data");
const methods = {
  POST: "POST",
  GET: "GET",
};
let player;
let world = new World();
world.loadWorld(worldData);
function availableRoomsOptions(arr) {
  return arr.map((room) => `<option value="${room.id}">${room.name}</option>`);
}
const server = http.createServer((req, res) => {
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
        availableRoomsOptions(worldData.rooms)
      );
      res.statusCode = 200;
      res.setHeader("Content-type", "text/html");
      res.write(resBody);
      return res.end();
    }

    // Phase 2: POST /player
    if (method === methods.POST && url === "/player") {
      const { name, roomId } = req.body;
      const playerStartingRoom = worldData.rooms.find(
        (room) => room.id === Number(roomId)
      );
      if (name && playerStartingRoom) {
        player = new Player(name, playerStartingRoom);
      } else {
        return res.end("Not a valid player name or room");
      }

      // response to add on phase 03
      // const htmlPage = fs.readFileSync('./views/room.html')
      // const resBody = htmlPage
      res.statusCode = 201;
      res.statusCode = 302;
      res.setHeader("Location", `/rooms/${roomId}`);
      return res.end();
    }
    // Phase 3: GET /rooms/:roomId

    // Phase 4: GET /rooms/:roomId/:direction

    // Phase 5: POST /items/:itemId/:action

    // Phase 6: Redirect if no matching route handlers
  });
});

const port = 5000;

server.listen(port, () => console.log("Server is listening on port", port));
