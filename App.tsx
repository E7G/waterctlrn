import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {
  Button,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  setUiUpdateCallback, 
  setErrorHandler, 
  autoReconnect, 
  handleButtonClick, 
  DEVICE_NAME, 
  start
} from './src/bluetooth';
import { resolveError } from "./src/errors";
import { getLogs, isLogEmpty } from "./src/logger";
import IdleTimerManager from 'react-native-idle-timer';
import { Linking } from 'react-native';

// 常量定义
const COUNTDOWN_DURATION = 420; // 7分钟 = 420秒
const ERROR_DIALOG_TIMEOUT = 3000; // 错误对话框自动关闭时间
const TIMER_UPDATE_INTERVAL = 1000; // 定时器更新间隔

// 类型定义
interface DialogContent {
  output: string;
  links: { url: string; text: string }[];
}

type UiStage = "pending" | "ok" | "standby";

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  
  // 状态管理
  const [deviceStatus, setDeviceStatus] = useState('未连接');
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>({ output: '', links: [] });
  const [buttonText, setButtonText] = useState('开启');
  const [isButtonDisabled, setButtonDisabled] = useState(false);
  const [debugLogs, setDebugLogs] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [isAppActive, setIsAppActive] = useState(true);

  // 引用管理
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const countdownStartTime = useRef<number>(0);
  const expectedEndTime = useRef<number>(0);

  // 样式配置
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 清理定时器
  const clearCountdownTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  // 启动倒计时
  const startCountdown = useCallback(() => {
    clearCountdownTimer();
    
    countdownStartTime.current = Date.now();
    expectedEndTime.current = countdownStartTime.current + (COUNTDOWN_DURATION * 1000);
    setRemainingTime(COUNTDOWN_DURATION);

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.round((expectedEndTime.current - now) / 1000);
      
      if (remaining > 0) {
        setRemainingTime(remaining);
        const drift = now - (expectedEndTime.current - (remaining * 1000));
        timeoutId.current = setTimeout(updateTimer, Math.max(0, TIMER_UPDATE_INTERVAL - drift));
      } else {
        setRemainingTime(0);
        // 时间到，可以在这里添加提醒逻辑
        // Alert.alert('时间到', '使用时间已结束，请及时结束会话');
      }
    };

    timeoutId.current = setTimeout(updateTimer, TIMER_UPDATE_INTERVAL);
  }, [clearCountdownTimer]);

  // 错误处理回调
  const handleError = useCallback((error: unknown) => {
    console.log('🚨 App 收到错误:', error);
    
    const { output, links, isFatal, showLogs } = resolveError(error);
    const safeLinks = links || [];
    
    setDialogContent({ output, links: safeLinks });
    setDebugLogs(showLogs ? getLogs().join('\n') : '');
    setDialogVisible(true);

    if (autoReconnect) {
      setTimeout(() => setDialogVisible(false), ERROR_DIALOG_TIMEOUT);
    }

    if (isFatal) {
      setButtonDisabled(true);
      setDeviceStatus('连接异常');
    }
  }, []);

  // UI 更新回调
  const updateUi = useCallback((stage: UiStage) => {
    console.log(`📱 App UI 状态更新: ${stage}`);
    
    switch (stage) {
      case "pending":
        setButtonText('请稍候');
        setButtonDisabled(true);
        setDeviceStatus(`已连接：${DEVICE_NAME}`);
        break;
      case "ok":
        setButtonText('结束');
        setButtonDisabled(false);
        startCountdown();
        break;
      case "standby":
        clearCountdownTimer();
        setRemainingTime(0);
        setButtonText('开启');
        setButtonDisabled(false);
        setDeviceStatus('未连接');
        break;
    }
  }, [startCountdown, clearCountdownTimer]);

  // 按钮点击处理
  const handleButtonPress = useCallback(() => {
    console.log('🔘 用户点击按钮:', buttonText);
    handleButtonClick();
  }, [buttonText]);

  // 链接点击处理
  const handleLinkPress = useCallback((url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('❌ 打开链接失败:', err);
      Alert.alert('错误', '无法打开链接');
    });
  }, []);

  // 关闭对话框
  const closeDialog = useCallback(() => {
    setDialogVisible(false);
  }, []);

  // 应用状态监听
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 应用状态变化:', nextAppState);
      setIsAppActive(nextAppState === 'active');
      
      if (nextAppState === 'background') {
        // 应用进入后台，可以在这里添加暂停逻辑
        console.log('⏸️ 应用进入后台');
      } else if (nextAppState === 'active') {
        // 应用回到前台，可以在这里添加恢复逻辑
        console.log('▶️ 应用回到前台');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // 应用加载时自动启动蓝牙
  useEffect(() => {
    console.log('🚀 应用启动，开始初始化蓝牙...');
    start().catch(error => {
      console.error('❌ 蓝牙初始化失败:', error);
      handleError(error);
    });
  }, [handleError]);

  // 设置屏幕常亮
  useEffect(() => {
    console.log('💡 设置屏幕常亮');
    IdleTimerManager.setIdleTimerDisabled(true);

    return () => {
      console.log('💡 恢复屏幕休眠');
      IdleTimerManager.setIdleTimerDisabled(false);
    };
  }, []);

  // 注册错误处理回调
  useEffect(() => {
    setErrorHandler(handleError);
    return () => setErrorHandler(null);
  }, [handleError]);

  // 注册UI更新回调
  useEffect(() => {
    setUiUpdateCallback(updateUi);
    return () => setUiUpdateCallback(null);
  }, [updateUi]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      console.log('🧹 App 组件卸载，清理资源');
      clearCountdownTimer();
    };
  }, [clearCountdownTimer]);

  return (
    <View style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {/* 主界面 */}
      <View style={styles.mainContainer}>
        <TouchableOpacity
          style={[styles.mainButton, isButtonDisabled && styles.buttonDisabled]}
          disabled={isButtonDisabled}
          onPress={handleButtonPress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
        
        <Text style={styles.deviceStatus}>{deviceStatus}</Text>
        
        {remainingTime > 0 && (
          <Text style={styles.timeStatus}>
            剩余时间: {formatTime(remainingTime)}
          </Text>
        )}
      </View>

      {/* 底部信息栏 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          copyright © 2025 E7G, licensed under MIT License
        </Text>
      </View>

      {/* 错误对话框 */}
      <Modal 
        visible={isDialogVisible} 
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={styles.dialogBackdrop}>
          <View style={[styles.dialogContainer, isDarkMode && styles.dialogContainerDark]}>
            <Text style={[styles.dialogTitle, isDarkMode && styles.dialogTitleDark]}>
              出现错误
            </Text>
            
            <Text style={[styles.dialogContent, isDarkMode && styles.dialogContentDark]}>
              {dialogContent.output}
              {dialogContent.links?.map((link, i) => (
                <Text 
                  key={i} 
                  style={[styles.linkText, isDarkMode && styles.linkTextDark]} 
                  onPress={() => handleLinkPress(link.url)}
                >
                  {link.text}
                </Text>
              ))}
            </Text>
            
            {debugLogs && (
              <ScrollView style={styles.debugScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.debugText, isDarkMode && styles.debugTextDark]}>
                  {debugLogs}
                </Text>
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={[styles.dialogButton, isDarkMode && styles.dialogButtonDark]}
              onPress={closeDialog}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>
                确定
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextDark: {
    color: '#FFFFFF',
  },
  deviceStatus: {
    marginVertical: 10,
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
  timeStatus: {
    marginVertical: 10,
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogContainerDark: {
    backgroundColor: '#1C1C1E',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000000',
  },
  dialogTitleDark: {
    color: '#FFFFFF',
  },
  dialogContent: {
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
  dialogContentDark: {
    color: '#FFFFFF',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  linkTextDark: {
    color: '#0A84FF',
  },
  dialogButton: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  dialogButtonDark: {
    backgroundColor: '#0A84FF',
  },
  debugScroll: {
    maxHeight: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  debugText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#3C3C43',
    fontFamily: 'monospace',
  },
  debugTextDark: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
  },
});

export default App;
