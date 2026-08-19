import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  ActivityIndicator, TouchableOpacity, RefreshControl, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const baseURL = 'http://localhost:28538/';

export default function MyReviews({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyReviews = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get(`${baseURL}api/review/my`, config);
      setReviews(response.data ? response.data.reverse() : []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  const formatDate = (dateString) => {
    if (!dateString || dateString.startsWith('0001')) return '---';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '---';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderStars = (rating) => {
    const totalStars = 5;
    let stars = [];
    for (let i = 1; i <= totalStars; i++) {
      stars.push(
        <Text key={i} style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.roomHeaderSection}>
        <Image 
          source={{ uri: item.roomImageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.roomImage}
          resizeMode="cover"
        />
        <View style={styles.roomMetaInfo}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.roomName || `Phòng #${item.roomId}`}
          </Text>
          <Text style={styles.dateText}>
            📅 {formatDate(item.checkInDate)} - {formatDate(item.checkOutDate)}
          </Text>
          <Text style={styles.postedDateText}>
            🕒 Đặt ngày: {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.reviewContentSection}>
        <View style={styles.ratingRow}>
          {renderStars(item.rating)}
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>{item.rating}.0 / 5</Text>
          </View>
        </View>
        
        <View style={styles.commentContainer}>
          <Text style={styles.quoteIcon}>“</Text>
          <Text style={styles.commentText}>
            {item.comment ? item.comment : "Người dùng không để lại lời bình luận."}
          </Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>📝</Text>
      </View>
      <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
      <Text style={styles.emptySubText}>
        Bạn chưa để lại nhận xét nào. Hãy hoàn thành các chuyến đi và chia sẻ trải nghiệm của mình nhé!
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.exploreButtonText}>Khám phá phòng ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backButtonText}>❮ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
        <View style={{ width: 70 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderReviewItem}
        contentContainerStyle={[styles.listContent, reviews.length === 0 && { flex: 1 }]}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              fetchMyReviews();
            }} 
            tintColor="#FF8C00"
            colors={['#FF8C00']} 
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
  loadingText: { marginTop: 12, color: '#667085', fontSize: 15 },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0'
  },
  backButton: { width: 70 },
  backButtonText: { color: '#475467', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },

  listContent: { padding: 16, paddingBottom: 40 },
  
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  
  roomHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#EAECF0',
  },
  roomMetaInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#344054',
    fontWeight: '500',
    marginBottom: 2,
  },
  postedDateText: {
    fontSize: 12,
    color: '#667085',
  },

  divider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 12,
  },

  reviewContentSection: {},
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 18,
  },
  starFilled: {
    color: '#FFB400',
  },
  starEmpty: {
    color: '#D0D5DD',
  },
  ratingBadge: {
    backgroundColor: '#FEF0C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: {
    color: '#DC6803',
    fontWeight: '700',
    fontSize: 12,
  },

  commentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F2F4F7',
  },
  quoteIcon: {
    fontSize: 20,
    color: '#FF8C00',
    fontWeight: 'bold',
    marginRight: 6,
    lineHeight: 22,
  },
  commentText: {
    flex: 1,
    fontSize: 14,
    color: '#344054',
    lineHeight: 20,
  },

  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32,
    marginTop: 60 
  },
  emptyIconCircle: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    backgroundColor: '#FFE4C4', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#101828', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#667085', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  exploreButton: { 
    backgroundColor: '#FF8C00', 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 12 
  },
  exploreButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});