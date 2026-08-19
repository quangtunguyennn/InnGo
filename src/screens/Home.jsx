import React, { useEffect, useState } from "react";
import { 
    View, Text, FlatList, Image, StyleSheet, ActivityIndicator, 
    TextInput,  StatusBar, TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

export default function Home({ navigation }) {
    const baseURL = 'http://localhost:28538/'; 
    
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await axios.get(`${baseURL}api/branch/getAll`);
                setBranches(response.data);
                setFilteredBranches(response.data);
            } catch (error) {
                console.error("Lỗi kết nối API lấy chi nhánh:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const formattedQuery = removeAccents(text.toLowerCase());
            const newData = branches.filter(item => {
                const branchData = removeAccents(`${item.name} ${item.city} ${item.address}`.toLowerCase());
                return branchData.includes(formattedQuery);
            });
            setFilteredBranches(newData);
        } else {
            setFilteredBranches(branches);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#FF8C00" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Khám phá InnGo</Text>
                <Text style={styles.subtitle}>Tìm kiếm điểm đến lý tưởng của bạn</Text>
                
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm theo tên, thành phố, địa chỉ..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            <FlatList
                data={filteredBranches}
                keyExtractor={(item, index) => item.branchId ? item.branchId.toString() : index.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏜️</Text>
                        <Text style={styles.emptyText}>Không tìm thấy chi nhánh nào phù hợp.</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('BranchDetail', { branch: item })}
                    >
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                        <View style={styles.cityBadge}>
                            <Text style={styles.cityBadgeText}>{item.city}</Text>
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.address} numberOfLines={2}>📍 {item.address}</Text>
                            {item.description && (
                                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
    headerContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
    searchIcon: { fontSize: 18, marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: '#333', padding: 0 },
    listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
    image: { width: '100%', height: 180 },
    cityBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255, 140, 0, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    cityBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    info: { padding: 16 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
    address: { fontSize: 13, color: '#555', marginBottom: 6, lineHeight: 18 },
    description: { fontSize: 13, color: '#888', lineHeight: 20 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
    emptyIcon: { fontSize: 40, marginBottom: 16 },
    emptyText: { fontSize: 15, color: '#666', textAlign: 'center' }
});