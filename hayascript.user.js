// ==UserScript==
// @name         Hayasaka Bot
// @namespace    https://github.com/ActuallyShip/Bot
// @version      5
// @description  Hayasaka Bot
// @author       lankyseat
// @match        https://www.reddit.com/r/place/*
// @match        https://new.reddit.com/r/place/*
// @connect      reddit.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @require	     https://cdn.jsdelivr.net/npm/toastify-js
// @resource     TOASTIFY_CSS https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css
// @updateURL    https://github.com/ActuallyShip/Place_Bot/raw/main/guyaplacebot.user.js
// @downloadURL  https://github.com/ActuallyShip/Place_Bot/raw/main/guyaplacebot.user.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

var socket;
var order = undefined;
var accessToken;
var currentOrderCanvas = document.createElement("canvas");
var currentOrderCtx = currentOrderCanvas.getContext("2d");
var currentPlaceCanvas = document.createElement("canvas");

// Global constants
const DEFAULT_TOAST_DURATION_MS = 10000;

const COLOR_MAPPINGS = {
  "#6D001A": 0,
  "#BE0039": 1,
  "#FF4500": 2,
  "#FFA800": 3,
  "#FFD635": 4,
  "#FFF8B8": 5,
  "#00A368": 6,
  "#00CC78": 7,
  "#7EED56": 8,
  "#00756F": 9,
  "#009EAA": 10,
  "#00CCC0": 11,
  "#2450A4": 12,
  "#3690EA": 13,
  "#51E9F4": 14,
  "#493AC1": 15,
  "#6A5CFF": 16,
  "#94B3FF": 17,
  "#811E9F": 18,
  "#B44AC0": 19,
  "#E4ABFF": 20,
  "#DE107F": 21,
  "#FF3881": 22,
  "#FF99AA": 23,
  "#6D482F": 24,
  "#9C6926": 25,
  "#FFB470": 26,
  "#000000": 27,
  "#515252": 28,
  "#898D90": 29,
  "#D4D7D9": 30,
  "#FFFFFF": 31,
};

let getRealWork = (rgbaOrder) => {
  let order = [];
  for (var i = 0; i < 4000000; i++) {
    if (rgbaOrder[i * 4 + 3] !== 0) {
      order.push(i);
    }
  }
  return order;
};

let getPendingWork = (work, rgbaOrder, rgbaCanvas) => {
  let pendingWork = [];
  for (const i of work) {
    const bllaaaaaa = rgbaOrderToHex(i, rgbaOrder);
    if (bllaaaaaa !== rgbaOrderToHex(i, rgbaCanvas) && bllaaaaaa !== "#C9A65F") {
      pendingWork.push(i);
    }
  }
  return pendingWork;
};

(async function () {
  GM_addStyle(GM_getResourceText("TOASTIFY_CSS"));
  currentOrderCanvas.width = 2000;
  currentOrderCanvas.height = 2000;
  currentOrderCanvas.style.display = "none";
  currentOrderCanvas = document.body.appendChild(currentOrderCanvas);
  currentPlaceCanvas.width = 2000;
  currentPlaceCanvas.height = 2000;
  currentPlaceCanvas.style.display = "none";
  currentPlaceCanvas = document.body.appendChild(currentPlaceCanvas);
  accessToken = await getAccessToken();

  attemptPlace();
  setInterval(async () => {
    accessToken = await getAccessToken();
  }, 30 * 60 * 1000);
})();

async function connectSocket() {
  try {
    var response = await fetch("https://api.allorigins.win/raw?url=https://pastebin.com/raw/sEKYzQQz");
    var responseText = await response.text();
    // i think this is where we get the image
    currentOrderCtx = await getCanvasFromUrl(responseText, currentOrderCanvas, 0, 0, true);
    // idk what order is
    order = getRealWork(currentOrderCtx.getImageData(0, 0, 2000, 2000).data);
  } catch (e) {
    setTimeout(() => {}, 10000);
    return;
  }
}

async function attemptPlace() {
  await connectSocket();

  // if we don't have the image data don't attempt place and try again in 2 seconds
  if (order === undefined) {
    setTimeout(attemptPlace, 2000); // probeer opnieuw in 2sec.
    return;
  }

  // Timer check should happen before work is calculated
  try {
    const timer = await checkTimer();
    const timeoutCheck = await timer.json();

    const nextTimestamp = timeoutCheck.data.act.data[0].data.nextAvailablePixelTimestamp;

    // if we can't place a pixel yet, try again once the time is up
    if (nextTimestamp && nextTimestamp > 0) {
      const nextPixel = nextTimestamp + 3000;
      const nextPixelDate = new Date(nextPixel);
      const delay = nextPixelDate.getTime() - Date.now();
      const toast_duration = delay > 0 ? delay : DEFAULT_TOAST_DURATION_MS;
      Toastify({
        text: `Your pixel isn't ready yet. Next pixel placed in ${nextPixelDate.toLocaleTimeString()}.`,
        duration: toast_duration,
      }).showToast();
      setTimeout(attemptPlace, delay);
      return;
    }
  } catch (e) {
    console.warn("Personal timer error", e);
    Toastify({
      text: "Error getting your personal timer, trying again in 20s...",
      duration: DEFAULT_TOAST_DURATION_MS * 2,
    }).showToast();
    setTimeout(attemptPlace, 20000); // probeer opnieuw in 10sec.
    return;
  }

  var ctx;
  // i think 0, 1, 2, and 3 are the differetn "quadrants" of the canvas
  // idk what this does
  // i think it somehow gets all the current canvas data and assigns it to ctx

  try {
    ctx = await getCanvasFromUrl(await getCurrentImageUrl(0), currentPlaceCanvas, 0, 0, false);
    ctx = await getCanvasFromUrl(await getCurrentImageUrl(1), currentPlaceCanvas, 1000, 0, false);
    ctx = await getCanvasFromUrl(await getCurrentImageUrl(2), currentPlaceCanvas, 2000, 0, false);
    ctx = await getCanvasFromUrl(await getCurrentImageUrl(3), currentPlaceCanvas, 0, 1000, false);
    ctx = await getCanvasFromUrl(await getCurrentImageUrl(4), currentPlaceCanvas, 1000, 1000, false);
    ctx = await getCanvasFromUrl(await getCurrentImageUrl(5), currentPlaceCanvas, 2000, 1000, false);
  } catch (e) {
    console.warn("Error retrieving map: ", e);
    Toastify({
      text: "Error retrieving map. Retrying in 5 secs...",
      duration: DEFAULT_TOAST_DURATION_MS,
    }).showToast();
    setTimeout(attemptPlace, 5000); // probeer opnieuw in 10sec.
    return;
  }

  // pull the complete image data from 2000x2000
  // I think rgbaOrder is what WE want
  // and rgbaCanvas is the ACTUAL CURRENT canvas
  const rgbaOrder = currentOrderCtx.getImageData(0, 0, 3000, 2000).data;
  const rgbaCanvas = ctx.getImageData(0, 0, 3000, 2000).data;

  // now lets assume work is some array of everything we need to do
  const work = getPendingWork(order, rgbaOrder, rgbaCanvas);

  if (work.length === 0) {
    Toastify({
      text: "All pixels are placed correctly, retrying in 30 seconds...",
      duration: 30000,
    }).showToast();
    setTimeout(attemptPlace, 30000); // probeer opnieuw in 30sec.
    return;
  }

  const percentComplete = 100 - Math.ceil((work.length * 100) / order.length);
  const workRemaining = work.length;
  const idx = Math.floor(Math.random() * work.length);
  console.log(work);
  const i = work[idx];
  const x = i % 3000;
  const y = Math.floor(i / 3000);
  const hex = rgbaOrderToHex(i, rgbaOrder);

  Toastify({
    text: `Trying to place pixel on ${x}, ${y}... (${percentComplete}% complete, ${workRemaining} remaining)`,
    duration: DEFAULT_TOAST_DURATION_MS * 3,
  }).showToast();

  // we have everything now
  // we know we can place, we know what needs to be done, now we must actually place the pixel

  console.log("actual x/y");
  console.log(x % 1000);
  console.log(y % 1000);

  try {
    const res = await place(x, y, COLOR_MAPPINGS[hex]);
    const data = await res.json();
    console.log(data);

    if (data.errors) {
      const error = data.errors[0];
      const nextPixel = error.extensions.nextAvailablePixelTs + 3000;
      const nextPixelDate = new Date(nextPixel);
      const delay = nextPixelDate.getTime() - Date.now();
      const toast_duration = delay > 0 ? delay : DEFAULT_TOAST_DURATION_MS;
      Toastify({
        text: `Pixel placed too fast! Next pixel placed in ${nextPixelDate.toLocaleTimeString()}.`,
        duration: toast_duration,
      }).showToast();
      setTimeout(attemptPlace, delay);
    } else {
      const nextPixel =
        data.data.act.data[0].data.nextAvailablePixelTimestamp + 3000 + Math.floor(Math.random() * 4000);
      const nextPixelDate = new Date(nextPixel);
      const delay = nextPixelDate.getTime() - Date.now();
      const toast_duration = delay > 0 ? delay : DEFAULT_TOAST_DURATION_MS;
      Toastify({
        text: `Pixel placed on ${x}, ${y}! Next pixel placed in ${nextPixelDate.toLocaleTimeString()}.`,
        duration: toast_duration,
      }).showToast();
      setTimeout(attemptPlace, delay);
    }
  } catch (e) {
    console.warn("Error parsing response", e);
    Toastify({
      text: `Error parsing response: ${e}.`,
      duration: DEFAULT_TOAST_DURATION_MS * 12,
    }).showToast();
    setTimeout(attemptPlace, 10000);
  }
}

function checkTimer() {
  return fetch("https://gql-realtime-2.reddit.com/query", {
    method: "POST",
    body: JSON.stringify({
      query:
        'mutation GetPersonalizedTimer{\n  act(\n    input: {actionName: "r/replace:get_user_cooldown"}\n  ) {\n    data {\n      ... on BasicMessage {\n        id\n        data {\n          ... on GetUserCooldownResponseMessageData {\n            nextAvailablePixelTimestamp\n          }\n        }\n      }\n    }\n  }\n}\n\n\nsubscription SUBSCRIBE_TO_CONFIG_UPDATE {\n  subscribe(input: {channel: {teamOwner: AFD2022, category: CONFIG}}) {\n    id\n    ... on BasicMessage {\n      data {\n        ... on ConfigurationMessageData {\n          __typename\n          colorPalette {\n            colors {\n              hex\n              index\n            }\n          }\n          canvasConfigurations {\n            dx\n            dy\n            index\n          }\n          canvasWidth\n          canvasHeight\n        }\n      }\n    }\n  }\n}\n\n\nsubscription SUBSCRIBE_TO_CANVAS_UPDATE {\n  subscribe(\n    input: {channel: {teamOwner: AFD2022, category: CANVAS, tag: "0"}}\n  ) {\n    id\n    ... on BasicMessage {\n      id\n      data {\n        __typename\n        ... on DiffFrameMessageData {\n          currentTimestamp\n          previousTimestamp\n          name\n        }\n        ... on FullFrameMessageData {\n          __typename\n          name\n          timestamp\n        }\n      }\n    }\n  }\n}\n\n\n\n\nmutation SET_PIXEL {\n  act(\n    input: {actionName: "r/replace:set_pixel", PixelMessageData: {coordinate: { x: 53, y: 35}, colorIndex: 3, canvasIndex: 0}}\n  ) {\n    data {\n      ... on BasicMessage {\n        id\n        data {\n          ... on SetPixelResponseMessageData {\n            timestamp\n          }\n        }\n      }\n    }\n  }\n}\n\n\n\n\n# subscription configuration($input: SubscribeInput!) {\n#     subscribe(input: $input) {\n#       id\n#       ... on BasicMessage {\n#         data {\n#           __typename\n#           ... on RReplaceConfigurationMessageData {\n#             colorPalette {\n#               colors {\n#                 hex\n#                 index\n#               }\n#             }\n#             canvasConfigurations {\n#               index\n#               dx\n#               dy\n#             }\n#             canvasWidth\n#             canvasHeight\n#           }\n#         }\n#       }\n#     }\n#   }\n\n# subscription replace($input: SubscribeInput!) {\n#   subscribe(input: $input) {\n#     id\n#     ... on BasicMessage {\n#       data {\n#         __typename\n#         ... on RReplaceFullFrameMessageData {\n#           name\n#           timestamp\n#         }\n#         ... on RReplaceDiffFrameMessageData {\n#           name\n#           currentTimestamp\n#           previousTimestamp\n#         }\n#       }\n#     }\n#   }\n# }\n',
      variables: {
        input: {
          channel: {
            teamOwner: "GROWTH",
            category: "R_REPLACE",
            tag: "canvas:0:frames",
          },
        },
      },
      operationName: "GetPersonalizedTimer",
      id: null,
    }),
    headers: {
      origin: "https://garlic-bread.reddit.com",
      referer: "https://garlic-bread.reddit.com/",
      "apollographql-client-name": "mona-lisa",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

function place(x, y, color) {
  return fetch("https://gql-realtime-2.reddit.com/query", {
    method: "POST",
    body: JSON.stringify({
      operationName: "setPixel",
      variables: {
        input: {
          actionName: "r/replace:set_pixel",
          PixelMessageData: {
            coordinate: {
              x: x % 1000,
              y: y % 1000,
            },
            colorIndex: color,
            canvasIndex: getCanvas(x, y),
          },
        },
      },
      query:
        "mutation setPixel($input: ActInput!) {\n  act(input: $input) {\n    data {\n      ... on BasicMessage {\n        id\n        data {\n          ... on GetUserCooldownResponseMessageData {\n            nextAvailablePixelTimestamp\n            __typename\n          }\n          ... on SetPixelResponseMessageData {\n            timestamp\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    }),
    headers: {
      origin: "https://garlic-bread.reddit.com",
      referer: "https://garlic-bread.reddit.com/",
      "apollographql-client-name": "mona-lisa",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

function getCanvas(x, y) {
  if (y <= 999) {
    if (x <= 999) {
      return 0;
    }
    if (x >= 999 && x <= 1999) {
      return 1;
    }
    if (x >= 1999 && x <= 2999) {
      return 2;
    }
  } else {
    if (x <= 999) {
      return 3;
    }
    if (x >= 999 && x <= 1999) {
      return 4;
    }
    if (x >= 1999 && x <= 2999) {
      return 5;
    }
  }
}

async function getAccessToken() {
  const usingOldReddit = window.location.href.includes("new.reddit.com");
  const url = usingOldReddit ? "https://new.reddit.com/r/place/" : "https://www.reddit.com/r/place/";
  const response = await fetch(url);
  const responseText = await response.text();

  // TODO: ew
  return responseText.split('"accessToken":"')[1].split('"')[0];
}

async function getCurrentImageUrl(id = "0") {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://gql-realtime-2.reddit.com/query", "graphql-ws");
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "connection_init",
          payload: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      ws.send(
        JSON.stringify({
          id: (id + 2).toString(),
          type: "start",
          payload: {
            variables: {
              input: {
                channel: {
                  teamOwner: "GARLICBREAD",
                  category: "CANVAS",
                  tag: id.toString(),
                },
              },
            },
            extensions: {},
            operationName: "replace",
            query:
              "subscription replace($input: SubscribeInput!) {\n  subscribe(input: $input) {\n    id\n    ... on BasicMessage {\n      data {\n        __typename\n        ... on FullFrameMessageData {\n          __typename\n          name\n          timestamp\n        }\n        ... on DiffFrameMessageData {\n          __typename\n          name\n          currentTimestamp\n          previousTimestamp\n        }\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
          },
        })
      );
    };

    ws.onmessage = (message) => {
      const { data } = message;
      const parsed = JSON.parse(data);

      // TODO: ew
      if (
        !parsed.payload ||
        !parsed.payload.data ||
        !parsed.payload.data.subscribe ||
        !parsed.payload.data.subscribe.data ||
        !parsed.payload.data.subscribe.data.name
      )
        return;

      ws.close();
      resolve(parsed.payload.data.subscribe.data.name + `?noCache=${Date.now() * Math.random()}`);
    };

    ws.onerror = reject;
  });
}

function convertBase64(string) {
  return btoa(string).replace(/\+/g, "-").replace(/\//g, "_");
}

function getCanvasFromUrl(url, canvas, x = 0, y = 0, clearCanvas = false) {
  return new Promise((resolve, reject) => {
    let loadImage = (ctx) => {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (clearCanvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, x, y);
        resolve(ctx);
      };
      img.onerror = () => {
        reject();
      };

      Toastify({
        text: `Retrieving canvas ${url}`,
        duration: DEFAULT_TOAST_DURATION_MS,
      }).showToast();
      img.src = url;
    };
    loadImage(canvas.getContext("2d"));
  });
}

// also wizard magic
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// some wizard magic
let rgbaOrderToHex = (i, rgbaOrder) => rgbToHex(rgbaOrder[i * 4], rgbaOrder[i * 4 + 1], rgbaOrder[i * 4 + 2]);
