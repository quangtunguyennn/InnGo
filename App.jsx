import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Home from './src/screens/Home';
import Login from './src/screens/Login';
import BranchDetail from './src/screens/BranchDetail';
import BookingTrans from './src/screens/BookingTrans';
import CustomBottomNavigation from './src/components/CustomBottomNavigation';

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

const SplashScreen = () => (
  <View style={styles.splashContainer}>
    <Image
      source={require('./src/assets/logo.png')}
      style={styles.splashLogo}
      resizeMode="cover"
    />

    <Text style={styles.brandName}>InnGo</Text>
    <ActivityIndicator size="large" color="#ffffff" />
  </View>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomBottomNavigation {...props} />}
    >
      <Tab.Screen name="Home" component={Home} />

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
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="MainTabs"
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />

          <Stack.Screen name="Login">
            {props => <Login {...props} onLoginSuccess={setUserToken} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={Register} />

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
          <Stack.Screen
            name="CompletePaymentBank"
            component={CompletePaymentBank}
          />
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
    width: 140,
    height: 140,
    borderRadius: 35,
    marginBottom: 15,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 30,
  },
});
