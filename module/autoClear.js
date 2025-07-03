import RenderLibV2 from "../../RenderLibV2";
import config from "../config";
import dungeonUtils from "../utils/dungeonUtils";
import { OdinDungeonUtils, S08PacketPlayerPosLook } from "../utils/mappings";
import pathfinderUtils from "../utils/pathfinderUtils";
import playerUtils from "../utils/playerUtils";
import rotationUtils from "../utils/rotationUtils";

let target;
let targetRenderDistance = 0;
let path = [];
let teleporting = false;
let finding = false;

const lineColor = [1, 1, 1];
const nodeColor = [0, 0, 0];

register("renderWorld", () => {
    if (!config().autoClear || !dungeonUtils.inDungeon()) return;

    if (path.length) {
        let prevNode;

        path.forEach(node => {
            if (!prevNode) prevNode = node;
            RenderLibV2.drawEspBoxV2(node[0] + 0.5, node[1] + 1, node[2] + 0.5, 0.25, 0.25, 0.25, ...nodeColor, 1, true, 2.5);
            RenderLibV2.drawLine(prevNode[0] + 0.5, prevNode[1] + 1, prevNode[2] + 0.5, node[0] + 0.5, node[1] + 1, node[2] + 0.5, ...lineColor, 1, true, 0.6);
            prevNode = node;
        })
    }

    if (target) {
        let height = 1.9;
        if (target.getName()?.includes("Fels")) height = 2.8;
        else if (target.getName()?.includes("Withermancer")) height = 2.8;

        RenderLibV2.drawEspBoxV2(target.getRenderX(), target.getRenderY() - Math.ceil(height), target.getRenderZ(), 0.5, height, 0.5, 1, 0, 0, 1, true, 2.5);
    }
})

register("tick", () => {
    if (!config().autoClear || Client.isInGui() || !dungeonUtils.inDungeon()) return;
    if (!target || target.isDead() || target.getEntity().func_110143_aJ() < 0.1 || getRoom(target) != dungeonUtils.getRoomName()) return getTarget(); // getHealth

    const targetPos = [target.getX(), target.getY() - Math.ceil(height), target.getZ()];
    targetRenderDistance = playerUtils.getRenderDistance(...targetPos)
    const targetRotations = rotationUtils.getRotations(targetPos[0], targetPos[1] - 0.5, targetPos[2]);

    if (targetRenderDistance < 3) {
        path = [];
        //rotationUtils.rotate(...targetRotations);
        //if (Player.getPlayer().field_70173_aa % 3 == 0) playerUtils.rightClick();
        return;
    }

    if (path.length == 0) return pathfind();

    finding = false;

})

register("command", () => {
    finding = false;
    getTarget();
    pathfind();
}).setName("pathfind2")

register("packetReceived", () => {
    if (teleporting) pathfind();
    teleporting = false;
}).setFilteredClass(S08PacketPlayerPosLook)

register("step", () => {
    if (config().autoClear && targetRenderDistance > 2 && target && (path.length == 0 || Player.getPlayer().field_70123_F || getRoom(target) != dungeonUtils.getRoomName())) {
        target = null;
        path = [];
        finding = false;
        getTarget();
    }
}).setDelay(5)

/**
 * Returns the furthest node the player can etherwarp to
 * @returns {Array}
*/
function getEtherwarpNode() {
    for (let i = path.length - 1; i > 0; i--) {
        const node = path[i];
        if (pathfinderUtils.isValidEtherwarp(new BlockPos(...node), 61)) return path[i];
    }

    return null;
}

/**
 * Sets the target as the nearest star mob
*/
function getTarget() {
    const entities = World.getAllEntities().filter(entity => entity.getName().removeFormatting().includes("✯") && getRoom(entity) === dungeonUtils.getRoomName());
    if (entities.length == 0) return;

    let nearest;
    let distance = 50;

    for (let i = 0; i < entities.length; i++) {
        const mob = entities[i];
        const dist = mob.getEntity().func_70032_d(Player.getPlayer()); // getRenderDistanceToEntity
        if (dist < distance) {
            nearest = mob;
            distance = dist;
        }
    }

    target = nearest;
}

/**
 * Etherwarps to the node and finds a new path to the target
 * @param {Array} node - the position to etherwarp to
*/
function etherwarpToNode(node) {
    teleporting = true;
    const nodePos = getPos(node);
    playerUtils.setMotion(0, Player.getMotionY(), 0);
    playerUtils.useItem("Aspect of the Void", rotationUtils.getRotations(...nodePos), true, config().oneTick, ChatLib.chat("hi"));
}

/**
 * Returns the position of the node
 * @param {Array} node - the node to get the position of
 * @returns {Array}
*/
function getPos(node) {
    if (!node) return;
    return [node[0] + 0.5, node[1] + 1, node[2] + 0.5];
}

/**
 * Pathfinds from the current position to the target
*/
function pathfind() {
    if (!target || finding) return;
    finding = true;

    let height = 2;
    if (target.getName()?.includes("Fels")) height = 2.9;
    else if (target.getName()?.includes("Withermancer")) height = 2.9;

    const targetPos = new BlockPos(target.getX(), target.getY() - Math.ceil(height), target.getZ());
    path = pathfinderUtils.aStar(targetPos, true, Math.SQRT2, pathfinderUtils.getBlockPos(Player));
}

/**
 * Returns the room of the entity
 * @param {Entity} entity
 * @returns {String}
*/
function getRoom(entity) {
    return OdinDungeonUtils.INSTANCE.getRoomAt(entity.getX(), entity.getZ())?.name; 
}