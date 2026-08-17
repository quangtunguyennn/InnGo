import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, ScrollView, 
   Image, TouchableOpacity, Alert
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  return `${day}/${month}/${date.getFullYear()}`;
};

export default function BookingDetail({ route, navigation }) {
  const { bookingId } = route.params || {};
  const baseURL = 'http://localhost:28538/';
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetail = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // API dựa theo ảnh: GET /api/booking/get/{bookingId}
        const response = await axios.get(`${baseURL}api/booking/get/${bookingId}`, config);
        setDetail(response.data);
      } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Không thể tải chi tiết đặt phòng.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetail();
    }
  }, [bookingId]);

  if (loading || !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  const canModify = detail.status !== 'Cancelled' && detail.status !== 'Checked out';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: detail.roomImageUrl || 'https://via.placeholder.com/400x200' }} 
          style={styles.heroImage} 
        />
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.roomName}>{detail.roomName}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{detail.status}</Text>
            </View>
          </View>
          
          <Text style={styles.location}>📍 {[detail.address, detail.city].filter(Boolean).join(', ')}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã đơn:</Text>
                <Text style={styles.infoValue}>#{detail.bookingId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày đặt:</Text>
                <Text style={styles.infoValue}>{formatDate(detail.bookedAt)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nhận phòng:</Text>
                <Text style={styles.infoValue}>{formatDate(detail.checkInDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trả phòng:</Text>
                <Text style={styles.infoValue}>{formatDate(detail.checkOutDate)}</Text>
              </View>
            </View>
          </View>

          {detail.selectedServices && detail.selectedServices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dịch vụ đi kèm</Text>
              <View style={styles.servicesContainer}>
                {detail.selectedServices.map((srv, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <Text style={styles.serviceName}>{srv.serviceName}</Text>
                    <Text style={styles.serviceQty}>x{srv.quantity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phương thức:</Text>
                <Text style={styles.infoValue}>{detail.paymentMethod}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trạng thái:</Text>
                <Text style={styles.infoValue}>{detail.paymentStatus}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.totalLabel}>Tổng tiền:</Text>
                <Text style={styles.totalValue}>{detail.totalAmount?.toLocaleString('vi-VN')} ₫</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {canModify && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditBooking', { bookingId: detail.bookingId })}
          >
            <Text style={styles.editButtonText}>Chỉnh sửa đơn đặt phòng</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroImage: { width: '100%', height: 220, backgroundColor: '#E0E0E0' },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  roomName: { fontSize: 24, fontWeight: 'bold', color: '#101828', flex: 1, marginRight: 10 },
  badge: { backgroundColor: '#ECFDF3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: '#027A48', fontWeight: 'bold', fontSize: 13 },
  location: { fontSize: 15, color: '#475467', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#101828', marginBottom: 12 },
  infoBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#F2F4F7', marginVertical: 10 },
  infoLabel: { fontSize: 15, color: '#667085' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#101828' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#101828' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6B00' },
  servicesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceItem: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', alignItems: 'center' },
  serviceName: { fontSize: 14, color: '#344054', marginRight: 8 },
  serviceQty: { fontSize: 14, fontWeight: 'bold', color: '#FF6B00' },
  bottomBar: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F2F4F7' },
  editButton: { backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  editButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});