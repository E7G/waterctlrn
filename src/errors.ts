interface ErrorCase {
  isHit: (msg: string) => boolean;
  output: string; // 改为直接返回字符串
  links?: Array<{ url: string; text: string }>; // 添加链接结构
  isFatal: boolean;
  showLogs: boolean;
}

const errorCases: ErrorCase[] = [
  {
    isHit: (msg) => !!msg.match(/WATERCTL INTERNAL Unknown RXD data/),
    output: "接收到未知数据。可能不影响使用。\n\n这可能是一个 Bug，请截图并",
    links: [{ url: 'https://github.com/E7G/waterctl_auto', text: '反馈给开发者' }],
    isFatal: false,
    showLogs: true,
  },
  {
    isHit: (msg) => !!msg.match(/WATERCTL INTERNAL (?:Refused|Bad key)/),
    output: "水控器拒绝启动。\n\n蓝牙水控器 FOSS 当前不支持您的水控器，请不要重试，多次失败可能造成水控器锁定。\n若发生锁定，水控器将拒绝一切传入连接；在通电状态下等待约一小时方可恢复。\n\n请截图并",
    links: [{ url: 'https://github.com/E7G/waterctl_auto', text: '反馈给开发者' }],
    isFatal: true,
    showLogs: true,
  },
  {
    isHit: (msg) => !!msg.match(/WATERCTL INTERNAL Operation timed out/),
    output: "等待时间似乎太长了。\n\n如果该问题反复发生，这可能是一个 Bug，请截图并",
    links: [{ url: 'https://github.com/E7G/waterctl_auto', text: '反馈给开发者' }],
    isFatal: false,
    showLogs: true,
  },
  {
    isHit: (msg) => !!msg.match(/No Services matching UUID|GATT Error: Not supported/),
    output: "不支持的机型。\n\n如果您有能力，欢迎一同参与蓝牙水控器 FOSS 的开发。\n详情请参考",
    links: [{ url: 'https://github.com/E7G/waterctl_auto', text: '源代码仓库' }],
    isFatal: true,
    showLogs: false,
  },
  {
    isHit: (msg) => !!msg.match(/User denied the browser permission|Web Bluetooth is not supported|Bluetooth adapter not available/),
    output: "设备不支持蓝牙，或浏览器权限未开启。\n\n请参考",
    links: [
      { url: 'https://github.com/E7G/waterctl_auto/blob/2.x/FAQ.md', text: '“疑难解答”' },
      { url: 'https://github.com/E7G/waterctl_auto', text: '源代码仓库' }
    ],
    isFatal: true,
    showLogs: false,
  },
  {
    isHit: (msg) => !!msg.match(/NetworkError|GATT operation failed|GATT Error Unknown/),
    output: "连接不稳定，与水控器通信失败。\n请重试。",
    isFatal: true,
    showLogs: false,
  },
  {
    isHit: () => true,
    output: "\n\n是什么呢\n\n（这可能是一个 Bug，请截图并",
    links: [{ url: 'https://github.com/E7G/waterctl_auto', text: '反馈给开发者' }],
    isFatal: true,
    showLogs: true,
  },
];

export function resolveError(error: unknown): ErrorCase {
  const errorString = error instanceof Error ? error.message : String(error);
  
  for (const c of errorCases) {
    if (c.isHit(errorString)) {
      return {
        ...c,
        output: errorString + c.output // 将错误信息附加到输出
      };
    }
  }

  throw new Error(`WATERCTL INTERNAL Unhandled: ${errorString}`);
}
