import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
   RefreshControl, Image, TouchableOpacity,
  Platform, Alert
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Favorites({ navigation }) {
  // LƯU Ý: Nếu chạy trên máy ảo Android, nhớ đổi localhost thành 10.0.2.2 nhé
  const baseURL = 'http://localhost:28538/'; 
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Lấy danh sách Wishlist
  const fetchWishlist = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${baseURL}api/wishlist/getAll`, config);
      setWishlist(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); 
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    fetchWishlist(); 
  }, [fetchWishlist]);

  // Xóa khỏi Wishlist (Dùng Toggle API)
  const handleRemoveWishlist = async (branchId, roomId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Gọi API Toggle
      await axios.patch(`${baseURL}api/wishlist/toggle?branchId=${branchId}&roomId=${roomId}`, {}, config);
      
      // Cập nhật lại UI lập tức bằng cách lọc phòng vừa xóa
      setWishlist((prev) => prev.filter(
        item => (item.roomId || item.RoomId) !== roomId || (item.branchId || item.BranchId) !== branchId
      ));

    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể xóa khỏi danh sách yêu thích lúc này.');
    }
  };

  const renderWishlistItem = ({ item }) => {
    // Xử lý case nhạy cảm chữ hoa/thường do JSON DTO
    const bId = item.branchId || item.BranchId;
    const rId = item.roomId || item.RoomId;
    const price = item.roomPrice || item.RoomPrice || 0;
    const rName = item.roomName || item.RoomName;
    const bName = item.branchName || item.BranchName;
    const imgUrl = item.roomImageUrl || item.RoomImageUrl || 'https://via.placeholder.com/400x200';

    // Gom dữ liệu thành cấu trúc object "room" mà trang RoomDetail đang cần
    const roomData = {
      roomId: rId,
      branchId: bId,
      price: price,
      imageUrl: imgUrl,
      roomType: rName,
      status: 'Available', // Trạng thái mặc định để code bên RoomDetail không bị lỗi UI
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={styles.card}
        // Đã sửa: Truyền object roomData thay vì truyền lẻ tẻ
        onPress={() => navigation.navigate('RoomDetail', { room: roomData })}
      >
        <Image source={{ uri: imgUrl }} style={styles.cardImage} resizeMode="cover" />
        
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text numberOfLines={2} style={styles.roomName}>{rName}</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{price.toLocaleString('vi-VN')} ₫</Text>
              <Text style={styles.priceUnit}>/đêm</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.iconText}>🏨</Text>
            <Text style={styles.infoText} numberOfLines={1}>{bName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.iconText}>📍</Text>
            <Text style={styles.infoText} numberOfLines={2}>
              {[item.address, item.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleRemoveWishlist(bId, rId)}
            >
              <Text style={styles.deleteButtonText}>Xóa 🗑️</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.bookButton}
              // Đã sửa: Truyền object roomData vào nút đặt phòng
              onPress={() => navigation.navigate('RoomDetail', { room: roomData })}
            >
              <Text style={styles.bookButtonText}>Đặt phòng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>💖</Text>
      </View>
      <Text style={styles.emptyTitle}>Chưa có mục yêu thích</Text>
      <Text style={styles.emptySubText}>Lưu lại những căn phòng bạn ưng ý để dễ dàng đặt lại bất cứ lúc nào!</Text>
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.exploreButtonText}>Tìm phòng ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <Text style={styles.headerSubtitle}>Những căn phòng bạn đã lưu lại</Text>
      </View>
      
      <FlatList 
        data={wishlist} 
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderWishlistItem} 
        contentContainerStyle={[styles.listContent, wishlist.length === 0 && { flex: 1 }]}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchWishlist} 
            tintColor="#FF6B00"
            colors={['#FF6B00']} 
          />
        } 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#101828', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#475467', fontWeight: '400' },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#EAECF0', shadowColor: '#101828', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180, backgroundColor: '#F2F4F7' },
  cardBody: { padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roomName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#101828', lineHeight: 24, marginRight: 12 },
  priceBadge: { alignItems: 'flex-end' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#FF6B00' },
  priceUnit: { fontSize: 12, color: '#667085', fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  iconText: { fontSize: 15, marginRight: 8, marginTop: 1 },
  infoText: { flex: 1, fontSize: 14, color: '#475467', fontWeight: '500', lineHeight: 20 },
  actionRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  deleteButton: { flex: 1, backgroundColor: '#FEF3F2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECDCA' },
  deleteButtonText: { color: '#B42318', fontSize: 14, fontWeight: '600' },
  bookButton: { flex: 2, backgroundColor: '#FF6B00', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  bookButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#667085', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FCE7F3', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#101828', marginBottom: 12 },
  emptySubText: { fontSize: 15, color: '#667085', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  exploreButton: { backgroundColor: '#FF6B00', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  exploreButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});