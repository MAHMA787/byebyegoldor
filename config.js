import Settings from "../Amaterasu/core/Settings"
import DefaultConfig from "../Amaterasu/core/DefaultConfig"

const scheme = "data/ColorScheme.json"
const config = new DefaultConfig("byebyegoldor", "data/settings.json")
  .addSwitch({
    category: "Auto P3",
    configName: "autoP3",
    title: "Auto P3 Toggle",
    description: "Toggles Auto P3"
  })
  .addSwitch({
    category: "Auto P3",
    configName: "disableRender",
    title: "Disable Rendering",
    description: "Disables Rendering"
  })
  .addSwitch({
    category: "Auto P3",
    configName: "circleRendering",
    title: "Circle Rendering",
    description: "Changes the rendering to render a circle instead of a square",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "Auto P3",
    configName: "typeRendering",
    title: "Type Rendering",
    description: "Renders the type of point above the ring",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "Auto P3",
    configName: "phase",
    title: "Phase",
    description: "Allows you to see the points through walls",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "Auto P3",
    configName: "sendMessages",
    title: "Send Messages",
    description: "Sends a message of the action you just used",
    shouldShow: data => data.autoP3
  })
  .addColorPicker({
    category: "Auto P3",
    configName: "renderColor",
    title: "Rendering Color",
    description: "Changes the rendering color",
    value: [255, 255, 255],
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "Auto P3",
    configName: "autoRouteSetup",
    title: "Auto Route Setup",
    description: "Automatically places etherwarp points when you etherwarp"
  })
  .addSwitch({
    category: "Auto P3",
    configName: "debugMessages",
    title: "Send Debug Messages",
    description: "Sends debug messages",
    shouldShow: data => data.autoP3
  })
  .addSwitch({
    category: "Blink",
    configName: "timerBalance",
    title: "Timer Balance",
    description: "Balances timer checks by cancelling unused player packets"
  })
  .addSwitch({
    category: "Blink",
    configName: "displayPackets",
    title: "Display Packets",
    description: "Displays how many balanced packets you have",
    shouldShow: data => data.timerBalance
  })
  .addSlider({
    category: "Blink",
    configName: "removeAmount",
    title: "Remove Amount",
    description: "Removes an amount of packets from the balanced amount (Default: 50)",
    options: [0, 100],
    value: 50,
    shouldShow: data => data.timerBalance
  })
  .addSlider({
    category: "Blink",
    configName: "removeInterval",
    title: "Remove Interval",
    description: "How many seconds between removing packets from the balanced amount (Default: 10)",
    options: [1, 20],
    value: 10,
    shouldShow: data => data.timerBalance
  })
  .addSwitch({
    category: "Blink",
    configName: "balanceBoss",
    title: "Only balance in boss",
    description: "Only balances packets in boss",
    shouldShow: data => data.timerBalance
  })
  .addSwitch({
    category: "Blink",
    configName: "renderBlink",
    title: "Render Blink Line",
    description: "Renders the path of the blink packets"
  })
  .addSlider({
    category: "Extra",
    configName: "hClipBoost",
    title: "HClip Boost",
    description: "Adds more speed to HClip (Default: 12)",
    options: [0, 15],
    value: 12
  })
  .addSwitch({
    category: "Extra",
    configName: "invWalk",
    title: "Invwalk",
    description: "Inventory walk for some random inventories"
  })
  .addSlider({
    category: "Extra",
    configName: "lavaClipBlocks",
    title: "Lava Clip Blocks",
    description: "How many blocks to clip down when you lavaclip",
    options: [10, 100],
    value: 40
  })
  .addSwitch({
    category: "Extra",
    configName: "bossClip",
    title: "Boss Clip",
    description: "Clips you down to storm when you enter boss"
  })
  .addSwitch({
    category: "Extra",
    configName: "witherESP",
    title: "Wither ESP",
    description: "Outlines the bosses in F7/M7"
  })
  .addColorPicker({
    category: "Extra",
    configName: "witherESPColor",
    title: "Wither ESP Color",
    description: "Changes the color for Wither ESP",
    value: [255, 255, 255],
    shouldShow: data => data.witherESP
  })
  .addSwitch({
    category: "Extra",
    configName: "leapNotifier",
    title: "Leap Notifier",
    description: "Notifies you when noone is in the previous section"
  })
  .addSwitch({
    category: "Extra",
    configName: "vertJerry",
    title: "Vertical Jerry",
    description: "Cancels horizontal knockback from a jerry-chine gun"
  })
  .addSwitch({
    category: "Extra",
    configName: "zeroPingEtherwarp",
    title: "Zero Ping Etherwarp",
    description: "Makes using etherwarp instantly teleport you"
  })
  .addSwitch({
    category: "Extra",
    configName: "keepMotion",
    title: "Etherwarp Keep Motion",
    description: "Keeps your motion when you etherwarp",
    shouldShow: data => data.zeroPingEtherwarp
  })
  .addSwitch({
    category: "Extra",
    configName: "packetlossDetector",
    title: "Packet Loss Detector",
    description: "Detects when the server lags"
  })
  .addSwitch({
    category: "Auto Leap",
    configName: "autoLeap",
    title: "Auto Leap",
    description: "Automatically leaps to the next early enter when you left click your leap"
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "ee2Leap",
    title: "Early Enter 2 Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "ee3Leap",
    title: "Early Enter 3 Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "coreLeap",
    title: "Core Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addTextInput({
    category: "Auto Leap",
    configName: "inCoreLeap",
    title: "Inside Core Leap",
    description: "",
    shouldShow: data => data.autoLeap
  })
  .addSwitch({
    category: "Auto Blood",
    configName: "autoBlood",
    title: "Auto Blood",
    description: "Automatically camps blood"
  })
  .addTextInput({
    category: "Auto Blood",
    configName: "autoBloodWeapon",
    title: "Auto Blood Weapon",
    description: "The item to use to kill the mobs",
    shouldShow: data => data.autoBlood
  })
  .addSlider({
    category: "Auto Blood",
    configName: "autoBloodYOffset",
    title: "Y Offset",
    description: "Offset for the y position of where to click",
    options: [-0.3, 0],
    value: -0.05,
    shouldShow: data => data.autoBlood
  })
  .addSlider({
    category: "Auto Blood",
    configName: "autoBloodKillTime",
    title: "Kill Time",
    description: "The time to pre-click before the mob spawns (set to 0 for dynamic ping detection)",
    options: [0, 300],
    value: 0,
    shouldShow: data => data.autoBlood
  })
  const setting = new Settings("byebyegoldor", config, scheme)
    .setPos(25, 25)
    .setSize(50, 50)
    .apply()
export default () => setting.settings