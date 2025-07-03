import request from "../../requestV2";
import config from "../config";
import mathUtils from "./mathUtils";
import rotationUtils from "./rotationUtils";
import timerUtils from "./timerUtils";

import {
    C06PacketPlayerPosLook,
    C08PacketPlayerBlockPlacement,
    C09PacketHeldItemChange,
    C0BPacketEntityAction,
    C0DPacketCloseWindow,
    C0EPacketClickWindow,
    S02PacketChat,
    S2DPacketOpenWindow,
    S2EPacketCloseWindow,
    KeyBinding,
    MathHelper,
    MCBlockPos,
    MCBlock,
    Potion,
    Vec3,
    KeyInputEvent,
    S08PacketPlayerPosLook
} from "./mappings";
import { registerWhen } from "../../BloomCore/utils/Utils";

class playerUtils {
    constructor() {
        this.coords = {};
        this.airTicks = 0;
        this.isSneaking = false;
        this.inTerminal = false;
        this.blinkTimeout = false;
        this.isBlinking = false;

        this.ping = 0;
        this.pinging = false;
        this.pingTimer = new timerUtils();

        this.keybinds = [
            new KeyBind(Client.getMinecraft().field_71474_y.field_74351_w), //w
            new KeyBind(Client.getMinecraft().field_71474_y.field_74368_y),//s
            new KeyBind(Client.getMinecraft().field_71474_y.field_74370_x),//a
            new KeyBind(Client.getMinecraft().field_71474_y.field_74366_z),//d
            new KeyBind(Client.getMinecraft().field_71474_y.field_151444_V)//sprint
        ];

        this.blacklistedPackets = [
            "C0FPacketConfirmTransaction",
            "C00PacketKeepAlive",
            "C00Handshake",
            "C00PacketLoginStart",
            "C00PacketServerQuery",
            "C01PacketPing",
            "C09PacketHeldItemChange",
            "C0BPacketEntityAction",
            "C16PacketClientStatus"
        ];

        this.termNames = [
            /^Click in order!$/,
            /^Select all the (.+?) items!$/,
            /^What starts with: '(.+?)'\?$/,
            /^Change all to same color!$/,
            /^Correct all the panes!$/,
            /^Click the button on time!$/
        ];

        register("command", () => this.setPosition(Math.floor(Player.getX()) + 0.5, Player.getY(), Math.floor(Player.getZ()) + 0.5)).setName("align");
        register("command", (yaw, pitch) => rotationUtils.rotate(yaw, pitch)).setName("rotate");

        register("tick", () => {
            if (Server.getIP() == "localhost" && !global.inFreeCam) {
                global.balancePackets = 400;
                Player.getPlayer().field_71075_bZ.func_82877_b(0.5);
                Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111128_a(0.5);
                const block = World.getBlockAt(Player.getX(), Player.getY(), Player.getZ());

                if (block.type.getID() == 66) {
                    this.setMotion(Player.getMotionX(), 3.5, Player.getMotionZ());
                    Client.scheduleTask(1, () => this.setMotion(Player.getMotionX(), 3.5, Player.getMotionZ()));
                } else if (Player.getPlayer().func_180799_ab()) this.setMotion(Player.getMotionX(), 3.5, Player.getMotionZ());
            }
        })

        register("packetSent", (packet, event) => {
            const action = packet.func_180764_b();
        
            if (action == C0BPacketEntityAction.Action.START_SNEAKING) {
                if (this.isSneaking) {
                    this.sendDebugMessage("Cancelled START_SNEAKING");
                    return cancel(event);
                }

                this.isSneaking = true;
            } else if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) {
                if (!this.isSneaking) {
                    this.sendDebugMessage("Cancelled STOP_SNEAKING");
                    return cancel(event);
                }

                this.isSneaking = false;
            }
        }).setFilteredClass(C0BPacketEntityAction)

        register("packetSent", (packet, event) => {
            if (!event.isCancelled()) this.slot = packet.func_149614_c();
        }).setFilteredClass(C09PacketHeldItemChange);

        register("packetReceived", (packet, event) => {
            const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());

            if (this.pinging && message.includes("/@@@@@")) {
                cancel(event)
                this.ping = this.pingTimer.getTimePassed();
                this.pinging = false;
            }
        }).setFilteredClass(S02PacketChat)

        register("worldUnload", () => {
            this.inTerminal = false;
        });

        register("packetReceived", (packet) => {
            try {
                const windowName = packet.func_179840_c().func_150254_d().removeFormatting();
                if (this.termNames.some(regex => windowName.match(regex))) this.inTerminal = true;
                else this.inTerminal = false;
            } catch (e) {
                this.sendMessage("&7Please run /ct reload");
            }
        }).setFilteredClass(S2DPacketOpenWindow)
        
        register("packetReceived", () => this.inTerminal = false).setFilteredClass(S2EPacketCloseWindow);
        register("packetSent", () => this.inTerminal = false).setFilteredClass(C0DPacketCloseWindow);

        register("step", () => {
            if (!Server.getIP()?.includes("hypixel")) return;
            this.pinging = true;
            this.pingTimer.reset();
            ChatLib.command("/@@@@@");
        }).setDelay(3);

        this.sneakKeybind = new KeyBind(Client.getMinecraft().field_71474_y.field_74311_E);
        this.lastS08 = new timerUtils();

        register("packetReceived", () => {
            this.lastS08.reset();
        }).setFilteredClass(S08PacketPlayerPosLook);
    }

    /**
     * Gets the player's render pos distance from the coordinates
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    getRenderDistance(x, y, z) {
        const renderManager = Client.getMinecraft().func_175598_ae();
        return Math.pow(renderManager.field_78730_l - x, 2) + Math.pow(renderManager.field_78731_m - 1 - y, 2) + Math.pow(renderManager.field_78728_n - z, 2);
    }

    /**
     * Gets the player's actual pos distance from the coordinates
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    getDistance(x, y, z) {
        return Math.pow(Player.getX() - x, 2) + Math.pow(Player.getY() - 1 - y, 2) + Math.pow(Player.getZ() - z, 2);
    }

    /**
     * Gets the player's distance from the coordinates
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    getBlockDistance(x, y, z) {
        const renderManager = Client.getMinecraft().func_175598_ae();
        const playerVec = new Vec3(renderManager.field_78730_l, renderManager.field_78731_m - 1, renderManager.field_78728_n);
        const targetVec = new Vec3(x, y, z);
        return targetVec.func_72438_d(playerVec);
    }

    /**
     * Sends a C08PacketPlayerBlockPlacement
    */
    rightClick() {
        if (Player.getHeldItemIndex() !== this.slot) {
            this.sendMessage("Prevented a 0 tick swap");
            Client.scheduleTask(1, () => this.rightClick());
            return;
        }

        Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem().getItemStack()));
    }

    /**
     * Makes the player left click
    */
    leftClick() {
        const method = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af");
        method.setAccessible(true);
        method.invoke(Client.getMinecraft());
    }

    /**
     * Makes the player sneak
     * @param {Boolean} boolean
    */
    setSneaking(boolean) {
        this.sneakKeybind.setState(boolean)
        KeyBinding.func_74510_a(this.sneakKeybind.getKeyCode(), boolean)
    }

    /**
     * Makes the player hold w
     * @param {Boolean} boolean
    */
    setForward(boolean) {
        new KeyBind(Client.getMinecraft().field_71474_y.field_74351_w).setState(boolean);
    }

    /**
     * Sets the player's position
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    setPosition(x, y, z) {
        Player.getPlayer().func_70107_b(x, y, z);
    }

    /**
     * Sets the player's position without setting up a boundingbox
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    setPositionNoBB(x, y, z) {
        Player.getPlayer().field_70165_t = x;
        Player.getPlayer().field_70163_u = y;
        Player.getPlayer().field_70161_v = z;
    }

    /**
     * Sets the player's motion
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    setMotion(x, y, z) {
        Player.getPlayer().func_70016_h(x, y, z);
    }

    swap(name) {
        const item = Player?.getInventory()?.getItems()?.findIndex(item => item?.getName()?.toLowerCase()?.includes(name?.toLowerCase()));
        if (item <= 8 && item >= 0) {
            this.sendDebugMessage(`&7Swapping to ${name}`);
            Player.setHeldItemIndex(item);
        } else {
            this.sendMessage(`&7Couldnt find ${name} in hotbar herp`)
        }
    }

    normalWalk(){
        Client.scheduleTask(() => {
        this.keybinds[0].setState(true);
        this.keybinds[4].setState(true);
        });
    }

doBoom() {
    const hotbarItems = Player?.getInventory()?.getItems()?.slice(0, 9) || [];
    const currentSlot = Player.getHeldItemIndex();
 
    const infinityBoom = hotbarItems.findIndex(item => 
        item?.getName()?.toLowerCase()?.includes("infinityboom tnt"));
    const superBoom = infinityBoom === -1 
        ? hotbarItems.findIndex(item => 
            item?.getName()?.toLowerCase()?.includes("superboom tnt"))
        : -1;

    const boomToUse = infinityBoom !== -1 ? infinityBoom : superBoom;

    if (boomToUse === -1) {
        this.sendMessage("&7Couldn't find any boom in hotbar");
        return;
    }

    this.sendDebugMessage(`&7Swapping to boom at slot ${boomToUse}`);
    Player.setHeldItemIndex(boomToUse);
    Client.scheduleTask(1, () => {
        this.leftClick();
        this.sendDebugMessage("&7Boom used, swapping back...");
    });
    Client.scheduleTask(2, () => {
        Player.setHeldItemIndex(currentSlot);
        this.sendDebugMessage(`&7Swapped back to slot ${currentSlot}`);
    });
}
    /**
     * @param {Number} yaw - The direction of walk
     */
    groundWalk(yaw) {
        if (!Player.asPlayerMP().isOnGround() || this.isSneaking) {
            this.sendMessage("Must be on ground and not sneaking");
            return;
        }

        this.walkYaw = yaw;
        this.isWalking = true;
        this.keyChangeMonitoringEnabled = false;

        Client.scheduleTask(6, () => {
            this.groundWalkKeyStates = this.keybinds.map(k => Keyboard.isKeyDown(k.getKeyCode()));
            this.keyChangeMonitoringEnabled = true;
        });
        Client.scheduleTask(() => {
            this.groundWalkListener = register("tick", () => {
                if (!this.shouldStopWalking()) {
                    const speed = this.getWalkSpeed()
                    Player.getPlayer().field_70159_w = speed * -Math.sin(this.walkYaw * Math.PI / 180);
                    Player.getPlayer().field_70179_y = speed * Math.cos(this.walkYaw * Math.PI / 180);
                } else {
                    this.stopMovement();
                    this.groundWalkListener.unregister();
                }
                
            });
        });
    }

    shouldStopWalking() {
        if (this.lastS08.getTimePassed() < 200) {
            this.sendMessage("Lagback detected. Disabling motion");
            return true;
        }

        if (this.isSneaking) {
            this.sendMessage("Stopped: Started sneaking");
            return true;
        }

        if (Player.getPlayer().func_180799_ab()) {
            return true;
        }

        if (this.keyChangeMonitoringEnabled && this.groundWalkKeyStates) {
            for (let i = 0; i < this.keybinds.length; i++) {
                const wasDown = this.groundWalkKeyStates[i];
                const isDown = Keyboard.isKeyDown(this.keybinds[i].getKeyCode());

                if (wasDown !== isDown) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Sets every movement keybind to be un-pressed
    */
    stopMovement() {
        this.keybinds.forEach(keybind => keybind.setState(false));
        if (this.groundWalkListener) {
            this.groundWalkListener.unregister();
            this.groundWalkListener = null;
        }
        this.isWalking = false;
        Player.getPlayer().field_70159_w = 0;
        Player.getPlayer().field_70179_y = 0;
    }

    /**
     * Re-handles the keybinds
    */
    handleKeys() {
        this.keybinds.forEach(keybind => keybind.setState(Keyboard.isKeyDown(keybind.getKeyCode())));
    }

    /**
     * Makes the player jump
    */
    jump() {
        KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), true);
        Client.scheduleTask(3, () => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), false));
    }

    /**
     * Returns true if the player isn't moving
    */
    isStill() {
        return Player.getMotionX() == 0 && Player.getMotionZ() == 0;
    }

    /**
     * Sets the player's motion to sprint speed at a yaw
     * @param {Number} yaw
    */
    hClip(yaw) {
        this.isHcliping = true
        this.stopMovement();
        this.setMotion(0, Player.getMotionY(), 0);

        Client.scheduleTask(0, () => {this.setSpeed(this.getWatchdogSpeed(), yaw, false)});
        Client.scheduleTask(1, () => {this.handleKeys()});
    }

    /**
     * Sets the player's motion to sprint speed at a yaw
     * @param {Number} yaw
    */
    airClip(yaw) {
        const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806
        Client.scheduleTask(0, () => {this.setSpeed(speed, yaw, false)});
        //Client.scheduleTask(1, () => {this.handleKeys()});

    }

    /**
     * Sets the player's motion at a yaw
     * @param {Number} speed 
     * @param {Number} yaw
     * @param {Boolean} decay
    */
    setSpeed(speed, yaw, decay) {
        const radians = mathUtils.toRadians(yaw);

        let sin = -Math.sin(radians) * speed;
        let cos = Math.cos(radians) * speed;

        if (decay && !Player.asPlayerMP().isOnGround()) {
            const airDecay = this.getAirDecay(yaw);

            sin = airDecay[0];
            cos = airDecay[1];
        }

        this.setMotion(sin, Player.getMotionY(), cos);
    }

    /**
     * Teleports you infront of yourself
     * @param {Number} distance 
    */
    clipForward(distance, yaw=Player.getYaw()) {
        const radians = mathUtils.toRadians(yaw);

        let sin = -Math.sin(radians) * distance;
        let cos = Math.cos(radians) * distance;

        this.setPosition(Player.getX() + sin, Player.getY(), Player.getZ() + cos);
    }

    /**
     * Returns the max speed watchdog allows
    */
    getWatchdogSpeed() {
        return ((5.6121 + 5.6121 * config().hClipBoost / 100) / 20) * (Player.getPlayer().field_71075_bZ.func_75094_b() * 10);
    }

    /**
     * Returns the sprint speed of the player
    */
    getSprintSpeed() {
        return (5.6121 / 20) * (Player.getPlayer().field_71075_bZ.func_75094_b() * 10);
    }

    /**
     * Returns the walk speed of the player
    */
    getWalkSpeed() {
        return (4.317 / 20) * (Player.getPlayer().field_71075_bZ.func_75094_b() * 10);
    }


    /**
     * Returns the speed of the player
    */
    getSpeed() {
        return Math.hypot(Player.getMotionX(), Player.getMotionZ());
    }

    /**
     * Gets the player's predicted fall motion
     * @param {Number} motion
     * @param {Number} ticks
    */
    predictedMotion(motion, ticks) {
        if (ticks == 0) return motion;
        let predicted = motion;
    
        for (let i = 0; i < ticks; i++) {
            predicted = (predicted - 0.08) * 0.98;
        }
    
        return predicted;
    }

    /**
     * Gets the air decay for the player
    */
    getAirDecay(dir) {
        const player = Player.getPlayer();

        const lastTickPos = [player.field_70142_S, player.field_70137_T, player.field_70136_U];
        const lastTickMotion = [Player.getX() - lastTickPos[0], Player.getZ() - lastTickPos[2]];

        const motionX = lastTickMotion[0] * 1 * 0.91 + 0.02 * 1.3 * Math.sin(dir);
        const motionZ = lastTickMotion[1] * 1 * 0.91 + 0.02 * 1.3 * Math.cos(dir);

        return [motionX, motionZ];
    }

    /**
     * Gets the slipperiness of the block under the player
    */
    getSlipperiness() {
        return World.getBlockStateAt(new BlockPos(Player.getX(), Player.getY(), Player.getZ())).func_177230_c().field_149765_K;
    }

    /**
     * Prints a message in chat
     * @param {String} message
    */
    sendMessage(message) {
        ChatLib.chat(`&6[&8byebyegoldor&6]&r ${message}`);
    }

    /**
     * Prints a debug message in chat
     * @param {String} message
    */
    sendDebugMessage(message) {
        if (config().debugMessages) ChatLib.chat(`&6[&8byebyegoldor&6]&r ${message}`);
    }

    /**
     * Returns the player's held item id
    */
    getHeldItemID() {
        return Player?.getHeldItem()?.getNBT()?.get("tag")?.get("ExtraAttributes")?.getString("id");
    }

    /**
     * Sends a click window packet to the server
     * @param {Number} windowId
     * @param {Number} slot
     * @param {Number} clickType
     * @param {Number} actionNumber
    */
    sendWindowClick(windowId, slot, clickType, actionNumber = 0) {
        Client.sendPacket(new C0EPacketClickWindow(windowId ?? Player.getContainer().getWindowId(), slot, clickType ?? 0, 0, null, actionNumber));
    }

    /**
     * Sends a click window packet to the server
     * @param {Entity} entity
     * 
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} z1
     * 
     * @param {Number} x2
     * @param {Number} y2
     * @param {Number} z2
    */
    isInBox(entity, x1, y1, z1, x2, y2, z2) {
        const x = entity.getX();
        const y = entity.getY();
        const z = entity.getZ();
    
        return (x >= Math.min(x1, x2) && x <= Math.max(x1, x2) &&
                y >= Math.min(y1, y2) && y <= Math.max(y1, y2) &&
                z >= Math.min(z1, z2) && z <= Math.max(z1, z2));
    }

    isHoldingLeap() {
        return ["SPIRIT_LEAP", "INFINITE_SPIRIT_LEAP"].includes(this.getHeldItemID());
    }

    /**
     * @param {Number} strafe
     * @param {Number} forward
     * @param {Number} friction
     * @param {Number} yaw
    */
    moveFlying(strafe, forward, friction, yaw) {
        let f = strafe * strafe + forward * forward;

        if (f >= 1E-4) {
            f = MathHelper.func_76129_c(f);

            if (f < 1.0) f = 1.0;

            f = friction / f;
            strafe = strafe * f;
            forward = forward * f;

            let f1 = Math.sin(yaw * Math.PI / 180.0);
            let f2 = Math.cos(yaw * Math.PI / 180.0);

            const motion = [strafe * f2 - forward * f1, forward * f2 + strafe * f1];
            ChatLib.chat(`x:${motion[0]},z:${motion[1]}`);
            return motion;
        }

        return [0, 0];
    }

    getForwardMovement(ticks, yaw) {
        const positions = [];
        let pos = [Player.getX(), Player.getY(), Player.getZ()];

        for (let i = 0; i < ticks; i++) {
            const flying = this.moveFlying(0, 1, this.getSlipperiness(), yaw);
            const newPos = [pos[0] + flying[0], pos[1], pos[2] + flying[1]];
            pos = newPos;
            positions.push(pos);
        }

        return positions;
    }

    /**
     * Returns the player's max walk speed
    */
    getWalkCapabilities() {
        return Player.getPlayer().field_71075_bZ.func_75094_b();
    }

    /**
     * Gets a mc blockpos at the position of the vector
     * @param {Vec3} vec3
    */
    getBlockPos(vec3) {
        return new MCBlockPos(vec3.field_72450_a, vec3.field_72448_b, vec3.field_72449_c);
    }

    /**
     * Swaps to an item, rotates, and uses it
     * @param {String} item - the name of the item being used
     * @param {Array} rotation - [yaw, pitch] being used
     * @param {Boolean} sneak - sneak before using the item, and unsneak after using the item
     * @param {Boolean} oneTick - whether to use a balanced packet to rotate instantly
     * @param {Function} onRotate - task to run after rotated
    */
    useItem(item, rotation, sneak, oneTick=false, onRotate, coords=[Player.getX(), Player.getZ()]) {
        this.sendDebugMessage(`&7${item}, sneak:${sneak}, yaw:${rotation[0]}, pitch:${rotation[1]}, onetick:${oneTick}`);

        new Thread(() => {
            if (sneak && !Player.isSneaking()) {
                this.setSneaking(true);
                Thread.sleep(50);
            } else {
                this.setSneaking(false);
                Thread.sleep(50);
            }

            if (!Player?.getHeldItem()?.getName()?.includes(item)) {
                this.swap(item);
                Thread.sleep(100);
            }

            if (global.balancePackets > 5 && oneTick) {
                global.balancePackets--;
                this.setPosition(coords[0], Player.getY(), coords[1]);
                Client.sendPacket(new C06PacketPlayerPosLook(Player.getX(), Player.getPlayer().func_174813_aQ().field_72338_b, Player.getZ(), rotation[0], rotation[1], Player.asPlayerMP().isOnGround()))
                
                onRotate;
            } else {
                this.setPosition(coords[0], Player.getY(), coords[1]);

                rotationUtils.rotate(MathHelper.func_76142_g(rotation[0] + 2.5), rotation[1]);
                Client.scheduleTask(0, () => {
                    rotationUtils.rotate(...rotation);
                    onRotate;
                });
            }
        }).start();
    }

    /**
     * Sends a C0BPacketEntityAction to sneak or unsneak
     * @param {Boolean} boolean - whether to sneak or unsneak
    */
    sendSneakPacket(boolean) {
        if (boolean) Client.sendPacket(new C0BPacketEntityAction(Player.getPlayer(), C0BPacketEntityAction.Action.START_SNEAKING));
        if (!boolean) Client.sendPacket(new C0BPacketEntityAction(Player.getPlayer(), C0BPacketEntityAction.Action.STOP_SNEAKING));
    }

    /**
     * Returns the current mayor
    */
    getMayor() {
        let mayor;
        request({ url:"https://api.hypixel.net/resources/skyblock/election", json:true }).then(response => mayor = response.mayor.name);
        return mayor;
    }

    /**
     * Plays a click sound at the player
    */
    clickSound() {
        World.playSound("random.click", 4, 4);
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {String} - The name of the block
    */
    getBlockNameAt(x, y, z) {
        const name = World.getBlockAt(x, y, z).type.name;
        if (name === "rrtile.air.name" || name == "tile.air.name") return "Air";
        else return name;
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {String} - The ID of the block
    */
    getBlockIDAt(x, y, z) {
        return World.getBlockAt(x, y, z).type.getID();
    }

    /**
     * @param {MCBlockPos} blockPos
     * @returns {String} - The name of the block
    */
    getBlockNameAtPos(blockPos) {
        return this.getBlockNameAt(blockPos.func_177958_n(), blockPos.func_177956_o(), blockPos.func_177952_p());
    }
    
    /**
     * @param {MCBlockPos} blockPos
     * @returns {String} - The ID of the block
    */
    getBlockIDAtPos(blockPos) {
        return this.getBlockIDAt(blockPos.func_177958_n(), blockPos.func_177956_o(), blockPos.func_177952_p());
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} id
    */
    setBlockAt(x, y, z, id) {
        const world = World.getWorld();
        const blockPos = this.getBlockPosFloor(x, y, z).toMCBlock();
        world.func_175656_a(blockPos, MCBlock.func_176220_d(id));
        world.func_175689_h(blockPos);
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
    */
    getBlockPosFloor(x, y, z) {
        return new BlockPos(Math.floor(x), Math.floor(y), Math.floor(z));
    }

    mcJump() {
        Player.getPlayer().field_70181_x = 0.42;
        if (Player.getPlayer().func_70644_a(Potion.field_76430_j)) Player.getPlayer().field_70181_x += ((Player.getPlayer().func_70660_b(Potion.field_76430_j).getAmplifier() + 1) * 0.1);

        if (Player.asPlayerMP().isSprinting()) {
            let f = Player.getYaw() * 0.017453292;
            Player.getPlayer().field_70159_w -= Math.sin(f) * 0.2;
            Player.getPlayer().field_70179_y += Math.cos(f) * 0.2;
        }
    }
}

export default new playerUtils();