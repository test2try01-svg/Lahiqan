import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LS_KEY = 'lahiq_items_v1';

export default function App() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [wheelModalVisible, setWheelModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState('movie');

  const [wheelWinner, setWheelWinner] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await AsyncStorage.getItem(LS_KEY);
      if (data) setItems(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveItems = async (newItems) => {
    try {
      setItems(newItems);
      await AsyncStorage.setItem(LS_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم العمل');
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      title: title.trim(),
      type,
      year: year ? parseInt(year) : null,
      genre: genre.trim(),
      cover: coverUrl.trim() || null,
      notes: notes.trim(),
      status: 'later',
      createdAt: Date.now()
    };
    const updated = [newItem, ...items];
    saveItems(updated);
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setYear('');
    setGenre('');
    setCoverUrl('');
    setNotes('');
    setType('movie');
  };

  const deleteItem = (id) => {
    Alert.alert('تأكيد الحذف', 'هل أنت تأكد من حذف هذا العمل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          const updated = items.filter(it => it.id !== id);
          saveItems(updated);
        }
      }
    ]);
  };

  const cycleStatus = (id) => {
    const nextStatus = { later: 'watching', watching: 'done', done: 'later' };
    const updated = items.map(it => {
      if (it.id === id) {
        return { ...it, status: nextStatus[it.status] };
      }
      return it;
    });
    saveItems(updated);
  };

  const spinWheel = () => {
    if (items.length === 0) {
      Alert.alert('القائمة فارغة', 'أضف أعمالاً أولاً لدوران العجلة');
      return;
    }
    const randomItem = items[Math.floor(Math.random() * items.length)];
    setWheelWinner(randomItem);
  };

  const filteredItems = items.filter(it => {
    const matchQ = it.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchQ;
    if (['movie', 'series'].includes(filterType)) return matchQ && it.type === filterType;
    return matchQ && it.status === filterType;
  });

  const renderItem = ({ item }) => {
    const statusLabel = { later: '⏳ لاحقًا', watching: '▶ أشاهده', done: '✓ شاهدته' }[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.coverBox}>
          {item.cover ? (
            <Image source={{ uri: item.cover }} style={styles.coverImg} />
          ) : (
            <View style={styles.phCover}>
              <Text style={styles.phText}>{item.title[0]}</Text>
            </View>
          )}
          <View style={[styles.badge, item.type === 'movie' ? styles.bgMovie : styles.bgSeries]}>
            <Text style={styles.badgeTxt}>{item.type === 'movie' ? 'فيلم' : 'مسلسل'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.year ? `${item.year} · ` : ''}{item.genre}</Text>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.statusBtn} onPress={() => cycleStatus(item.id)}>
              <Text style={styles.statusBtnTxt}>{statusLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.delBtn} onPress={() => deleteItem(item.id)}>
              <Text style={styles.delBtnTxt}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0c0e13" />

      <View style={styles.header}>
        <Text style={styles.logo}>لاحقًـ<Text style={{ color: '#f0b35c' }}>ا</Text></Text>
        <TouchableOpacity style={styles.wheelHeaderBtn} onPress={() => setWheelModalVisible(true)}>
          <Text style={styles.wheelHeaderBtnTxt}>🎡 العجلة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث في قائمتك..."
          placeholderTextColor="#98a1b3"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {[
          { key: 'all', label: 'الكل' },
          { key: 'movie', label: '🎬 أفلام' },
          { key: 'series', label: '📺 مسلسلات' },
          { key: 'later', label: '⏳ لاحقًا' },
          { key: 'watching', label: '▶ أشاهده' },
          { key: 'done', label: '✓ شاهدته' }
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filterType === f.key && styles.chipActive]}
            onPress={() => setFilterType(f.key)}
          >
            <Text style={[styles.chipTxt, filterType === f.key && styles.chipTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>🎬</Text>
            <Text style={styles.emptyTxt}>القائمة فارغة حالياً</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabTxt}>＋</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إضافة عمل جديد</Text>

            <TextInput
              style={styles.input}
              placeholder="اسم العمل *"
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.rowToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, type === 'movie' && styles.toggleActiveMovie]}
                onPress={() => setType('movie')}
              >
                <Text style={styles.toggleTxt}>🎬 فيلم</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, type === 'series' && styles.toggleActiveSeries]}
                onPress={() => setType('series')}
              >
                <Text style={styles.toggleTxt}>📺 مسلسل</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="السنة (مثال: 2024)"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={year}
              onChangeText={setYear}
            />

            <TextInput
              style={styles.input}
              placeholder="التصنيف (مثال: دراما، خيال علمي)"
              placeholderTextColor="#777"
              value={genre}
              onChangeText={setGenre}
            />

            <TextInput
              style={styles.input}
              placeholder="رابط الصورة (URL)"
              placeholderTextColor="#777"
              value={coverUrl}
              onChangeText={setCoverUrl}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={addItem}>
                <Text style={styles.saveBtnTxt}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnTxt}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={wheelModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎡 عجلة الحظ</Text>
            {wheelWinner ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Text style={{ color: '#f0b35c', fontSize: 16 }}>النتيجة:</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 5 }}>{wheelWinner.title}</Text>
              </View>
            ) : (
              <Text style={{ color: '#aaa', textAlign: 'center', marginVertical: 20 }}>اضغط على الزر لاختيار عمل عشوائي</Text>
            )}

            <TouchableOpacity style={styles.spinBtn} onPress={spinWheel}>
              <Text style={styles.spinBtnTxt}>🎲 اختيار عشوائي</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 15 }]} onPress={() => { setWheelModalVisible(false); setWheelWinner(null); }}>
              <Text style={styles.cancelBtnTxt}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0e13' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#f3efe4' },
  wheelHeaderBtn: { backgroundColor: 'rgba(240,179,92,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#f0b35c' },
  wheelHeaderBtnTxt: { color: '#f0b35c', fontWeight: 'bold' },
  searchBox: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { backgroundColor: '#171b25', color: '#fff', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, textAlign: 'right', borderWidth: 1, borderColor: '#272e3e' },
  filtersRow: { paddingHorizontal: 15, maxHeight: 40, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#171b25', marginRight: 8, borderWidth: 1, borderColor: '#272e3e' },
  chipActive: { backgroundColor: '#f0b35c' },
  chipTxt: { color: '#98a1b3', fontSize: 13 },
  chipTxtActive: { color: '#000', fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 10, paddingBottom: 80 },
  card: { flex: 1, margin: 8, backgroundColor: '#171b25', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#272e3e' },
  coverBox: { height: 180, width: '100%', backgroundColor: '#1e2433', justifyContent: 'center', alignItems: 'center' },
  coverImg: { width: '100%', height: '100%' },
  phCover: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  phText: { fontSize: 40, color: '#f0b35c', fontWeight: 'bold' },
  badge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  bgMovie: { backgroundColor: '#f0b35c' },
  bgSeries: { backgroundColor: '#e84a5f' },
  badgeTxt: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardContent: { padding: 10 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  cardMeta: { color: '#98a1b3', fontSize: 12, textAlign: 'right', marginTop: 2 },
  cardActions: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusBtn: { backgroundColor: '#272e3e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  statusBtnTxt: { color: '#f0b35c', fontSize: 11, fontWeight: 'bold' },
  delBtn: { padding: 5 },
  delBtnTxt: { fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyTxt: { color: '#98a1b3', marginTop: 10 },
  fab: { position: 'absolute', bottom: 25, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0b35c', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabTxt: { fontSize: 32, color: '#000', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#171b25', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#272e3e' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  input: { backgroundColor: '#0c0e13', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'right', marginBottom: 12, borderWidth: 1, borderColor: '#272e3e' },
  rowToggle: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#0c0e13', borderRadius: 8, marginHorizontal: 4 },
  toggleActiveMovie: { backgroundColor: '#f0b35c' },
  toggleActiveSeries: { backgroundColor: '#e84a5f' },
  toggleTxt: { color: '#fff', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: { backgroundColor: '#f0b35c', flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginLeft: 5 },
  saveBtnTxt: { color: '#000', fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#272e3e', flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginRight: 5 },
  cancelBtnTxt: { color: '#fff' },
  spinBtn: { backgroundColor: '#f0b35c', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  spinBtnTxt: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});
