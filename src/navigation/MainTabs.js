import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FloatingTabs from "../components/FloatingTabs";
import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import TodosScreen from "../screens/TodosScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();
function AddPlaceholder() { return null; }

export default function MainTabs() {
  return <Tab.Navigator tabBar={(props) => <FloatingTabs {...props} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: "홈" }} />
    <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: "캘린더" }} />
    <Tab.Screen name="AddDocument" component={AddPlaceholder} options={{ title: "문서 추가" }}
      listeners={({ navigation }) => ({ tabPress: event => {
        event.preventDefault();
        navigation.navigate("DocumentAdd");
      } })} />
    <Tab.Screen name="Todos" component={TodosScreen} options={{ title: "할 일" }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "설정" }} />
  </Tab.Navigator>;
}
