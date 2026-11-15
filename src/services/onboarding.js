// 첫 실행 안내: 한 번 보면 다시 안 띄우고, 로그인 화면·설정에서 다시 열 수 있다.
import AsyncStorage from "@react-native-async-storage/async-storage";

const DONE_KEY = "ttokdoc.onboarding.done";
const listeners = new Set();

export async function shouldShowOnboarding() {
  try { return (await AsyncStorage.getItem(DONE_KEY)) !== "yes"; } catch { return false; }
}

export async function finishOnboarding() {
  try { await AsyncStorage.setItem(DONE_KEY, "yes"); } catch {}
}

// 로그인 화면 또는 설정에서 다시 열 때
export function showOnboarding() {
  listeners.forEach((listener) => listener());
}

export function onShowOnboarding(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
