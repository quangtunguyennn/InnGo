import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,  ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
const baseURL = 'http://localhost:28538/';

export default function RoomDetail({ route, navigation }) {
  const { room, searchCheckIn, searchCheckOut } = route.params;
  const [rating, setRating] = useState(0);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const [ratingRes, servicesRes] = await Promise.all([
          axios.get(`${baseURL}api/room/avgRating`, { params: { roomId: room.roomId } }),
          axios.get(`${baseURL}api/service/getAll`)
        ]);
        setRating(ratingRes.data || 0);
        setServices(servicesRes.data || []);
      } catch (error) {
        console.error('Lỗi tải dữ liệu phòng:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomData();
  }, [room.roomId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: room.imageUrl }} style={styles.coverImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Trở về</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.roomHeaderInfo}>
            <Text style={styles.roomName}>{room.roomType}</Text>
            <View style={[styles.statusBadge, { backgroundColor: room.status === 'Available' ? '#28a745' : '#dc3545' }]}>
              <Text style={styles.statusText}>{room.status === 'Available' ? 'Hoạt động' : 'Tạm đóng'}</Text>
            </View>
          </View>
          
          <Text style={styles.roomPrice}>{room.price ? room.price.toLocaleString('vi-VN') : '0'} đ / đêm</Text>
          <Text style={styles.roomDetails}>👥 Sức chứa: {room.capacity} Người lớn</Text>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Đánh giá</Text>
            <View style={styles.ratingBox}>
                <Text style={styles.ratingNumber}>{rating > 0 ? rating.toFixed(1) : '0'}</Text>
                <Text style={styles.starIcon}>⭐</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllRatingBtn} 
              onPress={() => navigation.navigate('AllRatings', { roomId: room.roomId })}
            >
              <Text style={styles.viewAllRatingText}>Xem tất cả đánh giá &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Services Section */}
          <Text style={styles.sectionTitle}>Dịch vụ của chúng tôi</Text>
          {loading ? <ActivityIndicator size="small" color="#FF8C00" /> : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={services}
              keyExtractor={item => item.serviceId.toString()}
              renderItem={({ item }) => (
                <View style={styles.serviceCard}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.servicePrice}>{item.price ? item.price.toLocaleString('vi-VN') : '0'} đ</Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.bookBtn, room.status !== 'Available' && styles.bookBtnDisabled]}
          disabled={room.status !== 'Available'}
          onPress={() => navigation.navigate('BookingTrans', { room, searchCheckIn, searchCheckOut })}
        >
          <Text style={styles.bookBtnText}>Tiếp tục đặt phòng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  coverImage: { width: '100%', height: 280 },
  backButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  contentContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 20, paddingBottom: 100 },
  roomHeaderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roomName: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  roomPrice: { fontSize: 22, fontWeight: 'bold', color: '#FF8C00', marginBottom: 6 },
  roomDetails: { fontSize: 16, color: '#555', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  ratingSection: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 20 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingNumber: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a', marginRight: 8 },
  starIcon: { fontSize: 28 },
  viewAllRatingBtn: { alignSelf: 'flex-start' },
  viewAllRatingText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 14 },
  serviceCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginRight: 16, width: 140 },
  serviceName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  servicePrice: { fontSize: 14, color: '#FF8C00', fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderColor: '#eee' },
  bookBtn: { backgroundColor: '#FF8C00', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: '#ccc' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});