const fs = require("fs");

function redirectToHomePage(res) {
  const htmlPage = fs.readFileSync("./views/new-player.html", "utf-8");
  return res.end(htmlPage);
}

function actionsSwitcher(action, player, itemId) {
  switch (action) {
    case "take":
      player.takeItem(Number(itemId));
      break;
    case "eat":
      player.eatItem(Number(itemId));
      break;
    case "drop":
      player.dropItem(Number(itemId));
      break;
  }
}
module.exports = { redirectToHomePage, actionsSwitcher };
