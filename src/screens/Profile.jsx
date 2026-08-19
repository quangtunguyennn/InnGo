import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,

  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

const baseURL = 'http://localhost:28538/';

export default function Profile({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const isFocused = useIsFocused();

  const fetchProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${baseURL}api/auth/getProfile`, config);
      setProfileData(response.data);
    } catch (error) {
      console.error('Lỗi lấy thông tin profile:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('userToken');
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchProfile();
    }
  }, [isFocused, fetchProfile]);

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          setIsLoggedIn(false);
          setProfileData(null);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>

        {!isLoggedIn ? (
          <View style={styles.guestContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>👋</Text>
            </View>
            <Text style={styles.guestTitle}>Chào mừng bạn!</Text>
            <Text style={styles.guestSubtitle}>
              Đăng nhập để quản lý phòng và hồ sơ.
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                navigation.getParent()?.navigate('Login');

              }}
            >
              <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.infoCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profileData?.fullname
                      ? profileData.fullname.charAt(0).toUpperCase()
                      : 'U'}
                  </Text>
                </View>
                <View style={styles.profileNameBox}>
                  <Text style={styles.fullName}>
                    {profileData?.fullname || 'Chưa cập nhật'}
                  </Text>
                  <Text style={styles.emailText}>{profileData?.email}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {profileData?.totalBookings || 0}
                  </Text>
                  <Text style={styles.statLabel}>Lượt đặt phòng</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {profileData?.phone || '---'}
                  </Text>
                  <Text style={styles.statLabel}>Số điện thoại</Text>
                </View>
              </View>
            </View>

            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  navigation.navigate('EditProfile', { profile: profileData })
                }
              >
                <Text style={styles.menuIcon}>✏️</Text>
                <Text style={styles.menuText}>Chỉnh sửa thông tin</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Bookings')}
              >
                <Text style={styles.menuIcon}>📅</Text>
                <Text style={styles.menuText}>Lịch sử đặt phòng</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('MyReviews')}
              >
                <Text style={styles.menuIcon}>⭐️</Text>
                <Text style={styles.menuText}>Đánh giá của tôi</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('ChangePassword')}
              >
                <Text style={styles.menuIcon}>🔒</Text>
                <Text style={styles.menuText}>Đổi mật khẩu</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom:70 },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#101828',
    marginBottom: 24,
    marginTop: 10,
  },

  guestContainer: { alignItems: 'center', marginTop: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE4C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: { fontSize: 40 },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 8,
  },
  guestSubtitle: { fontSize: 15, color: '#667085', marginBottom: 30 },
  loginBtn: {
    backgroundColor: '#FF8C00',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#FF8C00',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  profileNameBox: { marginLeft: 16, flex: 1 },
  fullName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#101828',
    marginBottom: 4,
  },
  emailText: { fontSize: 14, color: '#667085' },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    paddingTop: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F2F4F7' },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#101828',
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, color: '#667085' },

  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  menuIcon: { fontSize: 20, marginRight: 16 },
  menuText: { flex: 1, fontSize: 16, color: '#101828', fontWeight: '500' },
  menuArrow: { fontSize: 24, color: '#98A2B3' },

  logoutBtn: {
    backgroundColor: '#FEF3F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  logoutBtnText: { color: '#B42318', fontSize: 16, fontWeight: 'bold' },
});