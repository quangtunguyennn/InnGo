import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import các màn hình chính
import Home from './src/screens/Home';
import Login from './src/screens/Login';
import BranchDetail from './src/screens/BranchDetail';
import BookingTrans from './src/screens/BookingTrans';
import CustomBottomNavigation from './src/components/CustomBottomNavigation';

// Giả định/Import các màn hình mới
import Bookings from './src/screens/Bookings';
import Favorites from './src/screens/Favorites';
import Profile from './src/screens/Profile';
import EditProfile from './src/screens/EditProfile';
import ChangePassword from './src/screens/ChangePassword';
import Register from './src/screens/Register';
import BookingDetail from './src/screens/BookingDetail';
import EditBooking from './src/screens/EditBooking';
import AllRatings from './src/screens/AllRatings';
import RoomDetail from './src/screens/RoomDetail';
import PostReview from './src/screens/PostReview';
import MyReviews from './src/screens/MyReviews';
import BlogDetail from './src/screens/BlogDetail';
import Blogs from './src/screens/Blogs';
import CompletePaymentBank from './src/screens/CompletePaymentBank';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Màn hình Splash Screen ---
const SplashScreen = () => (
  <View style={styles.splashContainer}>
    <Text style={styles.splashLogo}>InnGo</Text>
    <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
  </View>
);

// --- CỤM TAB BAR CHÍNH (4 TABS) ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomBottomNavigation {...props} />}
    >
      <Tab.Screen name="Home" component={Home} />
      {/* Thêm tab Blogs vào đây, ngay sau Home */}
      <Tab.Screen name="Blogs" component={Blogs} />
      <Tab.Screen name="Bookings" component={Bookings} />
      <Tab.Screen name="Favorites" component={Favorites} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token);
        } else {
          setUserToken(null);
        }
      } catch (error) {
        console.error('Lỗi khi lấy token:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    // Bọc SafeAreaProvider ở lớp ngoài cùng của ứng dụng
    <SafeAreaProvider>
      <NavigationContainer>
        {/* Đã gỡ bỏ điều kiện phân luồng, luôn cho MainTabs (Home) lên đầu */}
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainTabs">
          
          {/* Màn hình Tab chính */}
          <Stack.Screen name="MainTabs" component={MainTabs} />

          {/* Các màn hình Auth */}
          <Stack.Screen name="Login">
            {props => <Login {...props} onLoginSuccess={setUserToken} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={Register} />

          {/* Các màn hình phụ trợ & Chi tiết */}
          <Stack.Screen name="BranchDetail" component={BranchDetail} />
          <Stack.Screen name="RoomDetail" component={RoomDetail} />
          <Stack.Screen name="Bookings" component={Bookings} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="EditBooking" component={EditBooking} />
          <Stack.Screen name="BookingDetail" component={BookingDetail} />
          <Stack.Screen name="AllRatings" component={AllRatings} />
          <Stack.Screen name="BookingTrans" component={BookingTrans} />
          <Stack.Screen name="PostReview" component={PostReview} />
          <Stack.Screen name="MyReviews" component={MyReviews} />
          <Stack.Screen name="BlogDetail" component={BlogDetail} />
          <Stack.Screen name="CompletePaymentBank" component={CompletePaymentBank} />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
});