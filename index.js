global.authenticated = true;
global.balancePackets = 0;
global.inFreeCam = false;
global.hasMana = true;

import "./config";

// managers

import "./managers/configManager";
import "./managers/pointManager";
import "./managers/renderManager";

// modules

import "./module/hClip";
import "./module/invWalk";
import "./module/lavaClip";
import "./module/freeCam";
import "./module/bossClip";
import "./module/timerBalance";
import "./module/witherESP";
import "./module/leapNotifier";
import "./module/verticalJerry";
import "./module/zpew";
import "./module/packetlossDetector";
import "./module/autoBlood";

// utils

import "./utils/playerUtils";
import "./utils/rotationUtils";
import "./utils/leapUtils";
import "./utils/pathfinderUtils";
import "./utils/dungeonUtils";

register("command", () => ChatLib.command("warp dh", false)).setName("dh");
register("chat", () => ChatLib.command("l", false)).setCriteria("A kick occurred in your connection, so you were put in the SkyBlock lobby!");