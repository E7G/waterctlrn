// import { resolveError } from "./errors";
import { clearLogs, getLogs, isLogEmpty, log } from "./logger";
import { endEpilogue, baAck, offlinebombFix, startPrologue, endPrologue } from "./payloads";
import { makeStartEpilogue, makeUnlockResponse } from "./solvers";
import { bufferToHexString } from "./utils";
import BleManager from 'react-native-ble-manager';
// import { NativeModules, NativeEventEmitter } from 'react-native';
// import { Peripheral } from 'react-native-ble-manager';
// const BleManagerModule = NativeModules.BleManager;
// const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);



// 设备常量
export const DEVICE_NAME = "Water36088";
const DEVICE_ADDRESS = "6D:6C:00:02:73:63";
const SERVICE_UUID = "0000f1f0-0000-1000-8000-00805f9b34fb";
const TXD_UUID = "0000f1f1-0000-1000-8000-00805f9b34fb";
const RXD_UUID = "0000f1f2-0000-1000-8000-00805f9b34fb";

// let bluetoothdevice: BleDevice;

// 状态变量
let isStarted = false;
export let autoReconnect = true;

let pendingStartEpilogue: NodeJS.Timeout; // workaround for determining new firmware, see handleRxdNotifications
let pendingTimeoutMessage: NodeJS.Timeout; // if we don't get a response in time, we should show an error message

// UI控制函数
type UiUpdateCallback = (stage: "pending" | "ok" | "standby") => void;
let uiUpdateCallback: UiUpdateCallback | null = null;

export function setUiUpdateCallback(callback: UiUpdateCallback | null) {
  uiUpdateCallback = callback;
}

let updateUi = ((stage: "pending" | "ok" | "standby") => {
  if (uiUpdateCallback) {
    console.log(`Stage: ${stage}, Device Name: ${DEVICE_NAME}`);
    uiUpdateCallback(stage);
  } else {
    console.log(`Stage: ${stage}, Device Name: ${DEVICE_NAME}`);
  }
});

// 重试配置
const RETRY_CONFIG = {
  MAX_RETRIES: 3,           // 最大重试次数
  INITIAL_DELAY: 800,      // 初始延迟时间（毫秒）
  MAX_DELAY: 2000,         // 最大延迟时间（毫秒）
  BACKOFF_FACTOR: 2         // 退避因子
};

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 通用的重试包装函数
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount < RETRY_CONFIG.MAX_RETRIES) {
      const waitTime = Math.min(
        RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, retryCount),
        RETRY_CONFIG.MAX_DELAY
      );
      log(`${operationName}失败，${waitTime/1000}秒后进行第${retryCount + 1}次重试`);
      await delay(waitTime);
      return withRetry(operation, operationName, retryCount + 1);
    }
    log(`${operationName}在多次重试后仍然失败`);
    throw error;
  }
}

// 数据发送函数
async function writeValue(value: Uint8Array): Promise<void> {
  const msg = "TXD: " + bufferToHexString(value);
  try {
    await withRetry(async () => {
      await BleManager.writeWithoutResponse(
        DEVICE_ADDRESS,
        SERVICE_UUID,
        TXD_UUID,
        Array.from(value)
      );
      log(`发送数据成功: ${msg}`);
    }, '发送数据');
  } catch (error) {
    handleBluetoothError(error);
  }
}

// 断开连接处理
async function disconnect() {
  try {
    await BleManager.disconnect(DEVICE_ADDRESS, true);
  } catch (error) {
    console.error("Disconnect error:", error);
  }
  isStarted = false;
  clearLogs();
  clearTimeout(pendingStartEpilogue);
  clearTimeout(pendingTimeoutMessage);
  BleManager.stopNotification(DEVICE_ADDRESS, SERVICE_UUID, RXD_UUID);
  updateUi("standby");

  if (autoReconnect) {
    setTimeout(() => {
      start();
    }, 400);
  }
}

// 错误处理
// 新增类型和回调
type ErrorHandler = (error: unknown) => void;
let errorHandler: ErrorHandler | null = null;

export function setErrorHandler(callback: ErrorHandler | null) {
  errorHandler = callback;
}

// 修改后的错误处理函数
export async function handleBluetoothError(error: unknown) {
  console.error('Bluetooth Error:', error);
  errorHandler?.(error);
  if (autoReconnect) await disconnect();
}
// async function handleBluetoothError(error: unknown) {
//   const dialogContent = document.getElementById("dialog-content")!;
//   const dialogDebugContainer = document.getElementById("dialog-debug-container")!;
//   const dialogDebugContent = document.getElementById("dialog-debug-content")!;

//   const { output, isFatal, showLogs } = resolveError(error);
//   output(dialogContent, error);

//   dialogDebugContainer.style.display = "none";
//   if (!isLogEmpty() && showLogs) {
//     dialogDebugContainer.style.display = "block";
//     dialogDebugContent.textContent = "调试信息：\n" + getLogs().join("\n");
//   }

//   const dialog = document.getElementById("dialog") as HTMLDialogElement;
//   dialog.showModal(); // 显示对话框

//   // 3秒后关闭对话框
//   if (autoReconnect) {
//     setTimeout(() => {
//       dialog.close(); // 关闭对话框
//     }, 3000);
//   }

//   if (isFatal || autoReconnect) await disconnect();
// }

// RXD数据处理
// 用于存储最近接收到的数据及其出现次数
const recentDataMap = new Map<string, number>();
// 最大重复次数
const MAX_DUPLICATE_COUNT = 2;

async function handleRxdData(data: Uint8Array) {
  // 将数据转换为字符串，用于作为Map的键
  const dataKey = bufferToHexString(data);
  // 获取当前数据的重复次数
  const currentCount = recentDataMap.get(dataKey) || 0;

  // 如果重复次数达到最大限制，直接返回，不处理此次数据
  if (currentCount >= MAX_DUPLICATE_COUNT - 1) {
    return;
  }

  // 更新数据的重复次数
  recentDataMap.set(dataKey, currentCount + 1);

  // 一段时间后清除记录，避免内存泄漏
  setTimeout(() => {
    recentDataMap.delete(dataKey);
  }, 5000);

  //console.log("RXD: \ntype: "+typeof(data)+" \ncontent: " + data);
  log("RXD: " + bufferToHexString(data));
  // const dType = data[3];

  try {
    let payload = new Uint8Array(data);

    // due to a bug in the firmware, it may send an AT command "AT+STAS?" via RXD; it doesn't start with FDFD09
    if (payload[0] === 0x41 && payload[1] === 0x54 && payload[2] === 0x2b) {
      return;
    }

    if (payload[0] !== 0xfd && payload[0] !== 0x09) {
      throw new Error("WATERCTL INTERNAL Unknown RXD data");
    }

    // sometimes, the first one or two bytes are missing maybe due to bad firmware implementation
    // explanation: [0xFD, 0x09, ...] => [0xFD, 0xFD, 0x09, ...]
    if (payload[1] === 0x09) {
      payload = new Uint8Array([0xfd, ...payload]);
    }

    // explanation: [0x09, ...] => [0xFD, 0xFD, 0x09, ...]
    if (payload[0] === 0x09) {
      payload = new Uint8Array([0xfd, 0xfd, ...payload]);
    }

    // ... and sometimes it sends a single byte 0xFD
    if (payload.length < 4) {
      return;
    }

    const dType = payload[3];

    // https://github.com/prettier/prettier/issues/5158
    // prettier-ignore
    switch (dType) {
      case 0xB0:
      case 0xB1:
        clearTimeout(pendingStartEpilogue);
        pendingStartEpilogue = setTimeout(async () => {
          await writeValue(makeStartEpilogue(DEVICE_NAME));
        }, 500);
        break;
      case 0xAE:
        clearTimeout(pendingStartEpilogue);
        await writeValue(await makeUnlockResponse(data, DEVICE_NAME));
        break;
      case 0xAF:
        switch (data[5]) {
          case 0x55:
            await writeValue(makeStartEpilogue(DEVICE_NAME, true));
            break;
          case 0x01: // key authentication failed; "err41" (bad key)
          case 0x02: // ?
          case 0x04: // "err43" (bad nonce)
            throw new Error("WATERCTL INTERNAL Bad key");
          default:
            await writeValue(makeStartEpilogue(DEVICE_NAME, true));
            throw new Error("WATERCTL INTERNAL Unknown RXD data");
        }
        break;
      case 0xB2:
        clearTimeout(pendingStartEpilogue);
        clearTimeout(pendingTimeoutMessage);
        isStarted = true;
        updateUi("ok");
        break;
      case 0xB3:
        await writeValue(endEpilogue);
        await disconnect();
        break;
      case 0xAA: // telemetry, no need to respond
      case 0xB5: // temperature settings related, no need to respond
      case 0xB8: // unknown, no need to respond
        break;
      case 0xBA:
        await writeValue(baAck);
        break;
      case 0xBC:
        await writeValue(offlinebombFix);
        break;
      case 0xC8:
        throw new Error("WATERCTL INTERNAL Refused");
      // case 0xAA://不知道是什么，总是在第一次连接的时候出现
      //   console.warn("Unhandled RXD type:", dType);
      //   break;
      default:
        // console.warn("Unhandled RXD type:", dType);
        throw new Error("WATERCTL INTERNAL Unknown RXD data");
    }
  } catch (error) {
    handleBluetoothError(error);
  }
}

// 超时控制
function setupTimeoutMessage() {
  if (!pendingTimeoutMessage) {
    pendingTimeoutMessage = setTimeout(() => {
      handleBluetoothError("WATERCTL INTERNAL Operation timed out");
    }, 15000);
  }
}

// 主业务流程
let isScanning = false;
let isConnecting = false;

// 连接重试配置
const CONNECT_RETRY_CONFIG = {
  RETRY_DELAY: 400  // 固定400毫秒的重试间隔
};

export async function start() {
  if (isScanning || isConnecting) {
    log('已有连接任务在进行中');
    return;
  }

  isScanning = true;
  isConnecting = true;

  try {
    // 初始化蓝牙
    await withRetry(async () => {
      await BleManager.start({ showAlert: false });
      log('蓝牙模块初始化成功');
      await BleManager.enableBluetooth();
      log('蓝牙已启用');
    }, '蓝牙初始化');

    // 连接设备（使用固定间隔无限重试）
    let retryCount = 0;
    while (true) {
      try {
        await BleManager.connect(DEVICE_ADDRESS);
        const isConnected = await BleManager.isPeripheralConnected(DEVICE_ADDRESS, []);
        
        if (!isConnected) {
          throw new Error('连接失败');
        }
        
        log('设备连接成功');
        BleManager.onDisconnectPeripheral((args: any) => {
          log(`设备断开连接: ${JSON.stringify(args)}`);
          disconnect();
        });
        
        updateUi("pending");
        const peripheralInfo = await BleManager.retrieveServices(DEVICE_ADDRESS, [SERVICE_UUID]);
        log(`获取服务信息成功: ${JSON.stringify(peripheralInfo)}`);
        break; // 如果连接成功，跳出循环
      } catch (error) {
        retryCount++;
        log(`连接失败，${CONNECT_RETRY_CONFIG.RETRY_DELAY}毫秒后进行第${retryCount}次重试`);
        await delay(CONNECT_RETRY_CONFIG.RETRY_DELAY);
      }
    }
    
    // 设置通知
    await withRetry(async () => {
      await BleManager.startNotification(DEVICE_ADDRESS, SERVICE_UUID, RXD_UUID);
      log('通知服务启动成功');
      
      BleManager.onDidUpdateValueForCharacteristic(async (args: any) => {
        if (args.characteristic === RXD_UUID) {
          try {
            const rawData = new Uint8Array(args.value);
            await handleRxdData(rawData);
          } catch (error) {
            handleBluetoothError(error);
          }
        }
      });

      await writeValue(startPrologue);
      log('发送启动序列成功');
    }, '设置通知服务');

  } catch (error) {
    log('连接过程出错，放弃连接');
    handleBluetoothError(error);
  } finally {
    isScanning = false;
    isConnecting = false;
  }
}

async function end() {
  try {
    await writeValue(endPrologue);
    setupTimeoutMessage();
  } catch (error) {
    handleBluetoothError(error);
  }
}

// 按钮事件处理
export function handleButtonClick() {
  if (isStarted) {
    end();
  } else {
    start();
  }
}

//自动重连
// document.addEventListener("DOMContentLoaded", () => {
//   if (autoReconnect) {
//     setInterval(() => {
//       const mainButton = document.getElementById("main-button") as HTMLButtonElement;
//       if (mainButton.innerText == "开启") {
//         start();
//       }
//     }, 5000);
//   }
// });