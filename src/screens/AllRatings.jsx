import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
const baseURL = 'http://localhost:28538/';

export default function AllRatings({ route, navigation }) {
  const { roomId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${baseURL}api/review/getAll`, {
          params: { roomId }
        });
        setReviews(response.data);
      } catch (error) {
        console.error('Lỗi lấy danh sách đánh giá:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [roomId]);

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.ratingStars}>{'⭐'.repeat(item.rating)}</Text>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Trở về</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả đánh giá</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF8C00" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.reviewId.toString()}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có đánh giá nào cho phòng này.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { backgroundColor: '#fff', padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  backBtn: { marginRight: 16 },
  backBtnText: { fontSize: 16, color: '#1a1a1a', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  listContainer: { padding: 16 },
  reviewCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  ratingStars: { fontSize: 14 },
  comment: { fontSize: 14, color: '#555', lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888', fontStyle: 'italic' }
});