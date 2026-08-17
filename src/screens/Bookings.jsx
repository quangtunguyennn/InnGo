import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  RefreshControl, Image, TouchableOpacity,
  Platform, Alert
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

const getPaymentMethodLabel = (method) => {
  if (!method) return 'Tiền mặt';
  const m = method.toLowerCase();
  if (m.includes('cash')) return 'Thanh toán khi nhận phòng';
  if (m.includes('bank') || m.includes('banking')) return 'Thanh toán qua ngân hàng';
  return method;
};

export default function Bookings({ navigation }) {
  const baseURL = 'http://localhost:28538/';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${baseURL}api/booking/viewMyBookings`, config);
      
      // Kiểm tra trạng thái review và trạng thái hoàn tất thanh toán
      const enrichedBookings = await Promise.all(
        response.data.map(async (booking) => {
          let isReviewed = false;
          let isPaymentCompleted = false;

          // Gọi API kiểm tra thanh toán đã hoàn tất hay chưa
          try {
            const paymentRes = await axios.get(`${baseURL}api/payment/isCompleted?bookingId=${booking.bookingId}`, config);
            isPaymentCompleted = paymentRes.data;
          } catch (err) {
            console.error(`Lỗi check payment đơn ${booking.bookingId}:`, err);
            isPaymentCompleted = booking.paymentStatus === 'Paid'; // Fallback nếu lỗi API
          }

          // Kiểm tra đánh giá đối với đơn Checked out
          if (booking.status === 'Checked out') {
            try {
              const reviewRes = await axios.get(`${baseURL}api/booking/isReviewed?bookingId=${booking.bookingId}`, config);
              isReviewed = reviewRes.data;
            } catch (err) {
              console.error(`Lỗi check review đơn ${booking.bookingId}:`, err);
            }
          }

          return { ...booking, isReviewed, isPaymentCompleted };
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); 
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookings();
    });
    return unsubscribe;
  }, [navigation, fetchBookings]);

  const handleToggleWishlist = async (branchId, roomId) => {
    try {
      if (!branchId || !roomId) {
        Alert.alert('Lỗi', 'Dữ liệu phòng không hợp lệ.');
        return;
      }
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`${baseURL}api/wishlist/toggle?branchId=${branchId}&roomId=${roomId}`, {}, config);
      Alert.alert('Thành công', 'Đã cập nhật danh sách yêu thích!');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích lúc này.');
    }
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy đặt phòng này không?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Có, Hủy', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const config = { headers: { Authorization: `Bearer ${token}` } };
              await axios.patch(`${baseURL}api/booking/cancel/${bookingId}`, {}, config);
              Alert.alert('Thành công', 'Đã hủy đặt phòng.');
              fetchBookings();
            } catch (error) {
              console.error(error);
              Alert.alert('Lỗi', 'Không thể hủy đặt phòng. Vui lòng thử lại sau.');
            }
          } 
        }
      ]
    );
  };

  const handleReviewPress = (bookingId, roomId) => {
    navigation.navigate('PostReview', { bookingId: bookingId, roomId: roomId });
  };

  const getBookingStatus = (status) => {
    switch(status) {
      case 'Confirmed': return { bg: '#ECFDF3', text: '#027A48', label: 'Đã xác nhận' };
      case 'Pending': return { bg: '#FFFAEB', text: '#B54708', label: 'Chờ xử lý' };
      case 'Cancelled': return { bg: '#FEF3F2', text: '#B42318', label: 'Đã hủy' };
      case 'Checked out': return { bg: '#F2F4F7', text: '#344054', label: 'Đã trả phòng' };
      default: return { bg: '#F2F4F7', text: '#344054', label: status || 'Không rõ' };
    }
  };

  const getPaymentStatus = (status) => {
    switch(status) {
      case 'Paid': return { text: '#175CD3', label: 'Đã thanh toán' };
      case 'Unpaid': return { text: '#B42318', label: 'Chưa thanh toán' };
      default: return { text: '#344054', label: status || 'Chưa rõ' };
    }
  };

  const renderBookingItem = ({ item }) => {
    const bookingStatus = getBookingStatus(item.status);
    const paymentStatus = getPaymentStatus(item.paymentStatus);
    const isCashPayment = item.paymentMethod && item.paymentMethod.toLowerCase().includes('cash');
    
    // Đã sửa đổi tại đây: Thêm && !item.isPaymentCompleted để ẩn nút Hủy/Sửa nếu đã thanh toán
    const canModify = item.status !== 'Cancelled' && item.status !== 'Checked out' && !item.isPaymentCompleted;
    const isCheckedOut = item.status === 'Checked out';

    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.bookingId })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>Mã đơn: <Text style={styles.bookingIdBold}>#{item.bookingId || 'N/A'}</Text></Text>
          
          <View style={styles.headerActions}>
            <View style={[styles.badge, { backgroundColor: bookingStatus.bg }]}>
              <Text style={[styles.badgeText, { color: bookingStatus.text }]}>{bookingStatus.label}</Text>
            </View>
            <TouchableOpacity 
              style={styles.wishlistBtn}
              onPress={() => handleToggleWishlist(item.branchId, item.roomId)}
            >
              <Text style={styles.heartIcon}>❤️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Image 
            source={{ uri: item.roomImageUrl || 'https://via.placeholder.com/150' }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardInfo}>
            <Text numberOfLines={2} style={styles.roomName}>{item.roomName}</Text>
            
            {(item.address || item.city) && (
              <View style={styles.infoRow}>
                <Text style={styles.iconText}>📍</Text>
                <Text style={styles.infoText}>
                  {[item.address, item.city].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.iconText}>🗓</Text>
              <Text style={styles.infoText}>
                {formatDate(item.checkInDate)} - {formatDate(item.checkOutDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.iconText}>💳</Text>
              <Text style={[styles.infoText, { fontWeight: '600', color: paymentStatus.text }]}>
                {paymentStatus.label} ({getPaymentMethodLabel(item.paymentMethod)})
              </Text>
            </View>
          </View>
        </View>

        {item.selectedServices && item.selectedServices.length > 0 && (
          <View style={styles.serviceContainer}>
            {item.selectedServices.map((s, idx) => (
              <View key={idx} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>
                  {s.serviceName || `Dịch vụ ${s.serviceID}`} <Text style={styles.serviceQty}>x{s.quantity}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerWrapper}>
          <View style={styles.cardFooter}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalPrice}>
              {item.totalAmount?.toLocaleString('vi-VN')} ₫
            </Text>
          </View>

          {(canModify || isCheckedOut) && (
            <View style={styles.actionRow}>
              {canModify && (
                <>
                  <TouchableOpacity 
                    style={styles.outlineButton}
                    onPress={() => handleCancelBooking(item.bookingId)}
                  >
                    <Text style={styles.outlineButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.outlineButton}
                    onPress={() => navigation.navigate('EditBooking', { bookingId: item.bookingId })}
                  >
                    <Text style={styles.outlineButtonText}>Sửa</Text>
                  </TouchableOpacity>

                  {!item.isPaymentCompleted && !isCashPayment && (
                    <TouchableOpacity 
                      style={styles.payButton}
                      onPress={() => navigation.navigate('CompletePaymentBank', {
                        bookingId: item.bookingId,
                        amount: item.totalAmount
                      })}
                    >
                      <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {isCheckedOut && (
                item.isReviewed ? (
                  <View style={styles.thankYouContainer}>
                    <Text style={styles.thankYouText}>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.reviewButton}
                    onPress={() => handleReviewPress(item.bookingId, item.roomId)}
                  >
                    <Text style={styles.reviewButtonText}>Đánh giá trải nghiệm</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>✈️</Text>
      </View>
      <Text style={styles.emptyTitle}>Chưa có chuyến đi nào</Text>
      <Text style={styles.emptySubText}>Bạn chưa thực hiện đặt phòng nào. Hãy khám phá các điểm đến tuyệt vời ngay!</Text>
      <TouchableOpacity activeOpacity={0.8} style={styles.exploreButton}>
        <Text style={styles.exploreButtonText}>Khám phá ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải dữ liệu chuyến đi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chuyến đi của bạn</Text>
        <Text style={styles.headerSubtitle}>Quản lý lịch sử và chi tiết đặt phòng</Text>
      </View>
      
      <FlatList 
        data={bookings} 
        keyExtractor={(item, index) => item.bookingId ? item.bookingId.toString() : index.toString()}
        renderItem={renderBookingItem} 
        contentContainerStyle={[styles.listContent, bookings.length === 0 && { flex: 1 }]}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchBookings} 
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EAECF0', shadowColor: '#101828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  bookingId: { fontSize: 13, color: '#667085' },
  bookingIdBold: { fontWeight: '700', color: '#101828' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  wishlistBtn: { marginLeft: 12, padding: 4 },
  heartIcon: { fontSize: 18 },
  cardBody: { flexDirection: 'row', padding: 16 },
  cardImage: { width: 84, height: 84, borderRadius: 12, backgroundColor: '#F2F4F7' },
  cardInfo: { flex: 1, marginLeft: 14, justifyContent: 'space-between' },
  roomName: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 8, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }, 
  iconText: { fontSize: 14, marginRight: 6, marginTop: 2 }, 
  infoText: { fontSize: 13, color: '#475467', fontWeight: '500', flex: 1 }, 
  serviceContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 12, gap: 8 }, 
  serviceTag: { backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F2F4F7' }, 
  serviceTagText: { fontSize: 12, color: '#344054', fontWeight: '500' },
  serviceQty: { color: '#FF6B00', fontWeight: '700' },
  footerWrapper: { backgroundColor: '#F9FAFB', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopWidth: 1, borderTopColor: '#F2F4F7' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  totalLabel: { fontSize: 14, color: '#475467', fontWeight: '500' },
  totalPrice: { fontSize: 18, fontWeight: '800', color: '#FF6B00' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 10 }, 
  outlineButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D0D5DD', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, 
  outlineButtonText: { fontSize: 14, fontWeight: '600', color: '#344054' },
  payButton: { flex: 1.5, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center' }, 
  payButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  
  reviewButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#027A48', alignItems: 'center', justifyContent: 'center' },
  reviewButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  thankYouContainer: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#ECFDF3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1FADF' },
  thankYouText: { fontSize: 13, fontWeight: '600', color: '#027A48', textAlign: 'center' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#667085', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FEF0C7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#101828', marginBottom: 12 },
  emptySubText: { fontSize: 15, color: '#667085', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  exploreButton: { backgroundColor: '#FF6B00', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  exploreButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});