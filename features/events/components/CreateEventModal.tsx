import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/storage/useGameStore';
import { ensureNotificationPermission } from '@/services/notifications';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Technology & Academic',
  'Cultural & Art',
  'Lecture & Seminar',
  'Sports & Activity',
  'Secret Mission',
];

// พิกัดแนะนำพร้อมรูปถ่ายจริงคุณภาพสูงรอบ มข. และกิจกรรมที่เกี่ยวข้อง
const PRESET_LOCATIONS = [
  {
    name: 'ริมบึงสีฐาน มข. (เวทีดนตรี & เทศกาล)',
    lat: 16.4564,
    lon: 102.8079,
    // ภาพคอนเสิร์ต/ดนตรีริมน้ำและเทศกาลยามค่ำคืน
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'วิทยาลัยการคอมพิวเตอร์ (CP KKU)',
    lat: 16.4745,
    lon: 102.8240,
    // ภาพบรรยาย AI / Coding Tech
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'อุทยานวิทยาศาสตร์ ภาคตะวันออกเฉียงเหนือ (Science Park)',
    lat: 16.4730,
    lon: 102.8206,
    // ภาพงาน Hackathon & Expo นวัตกรรม
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'ซุ้มประตูกาลพฤกษ์ มข.',
    lat: 16.4730,
    lon: 102.8206,
    image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'สนามกีฬา 50 ปี มข. (กีฬาสี & สันทนาการ)',
    lat: 16.4680,
    lon: 102.8180,
    // ภาพกิจกรรมกีฬา/สนามกีฬา
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'ศูนย์อาหารคอมเพล็กซ์ มข.',
    lat: 16.4705,
    lon: 102.8235,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'วัดหนองแวง พระอารามหลวง',
    lat: 16.4158,
    lon: 102.8388,
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80',
  },
];

export default function CreateEventModal({ visible, onClose }: CreateEventModalProps) {
  const createCampusEvent = useGameStore((s) => s.createCampusEvent);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationName, setLocationName] = useState('วิทยาลัยการคอมพิวเตอร์ (CP KKU)');
  const [markerCoord, setMarkerCoord] = useState({ latitude: 16.4745, longitude: 102.8240 });
  const [rewardXp, setRewardXp] = useState('200');
  const [rewardCoins, setRewardCoins] = useState('100');
  const [autoScheduleNotification, setAutoScheduleNotification] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(PRESET_LOCATIONS[0].image);

  // Time Selection
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // เลือกรูปภาพจากอัลบั้มเครื่อง
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'กรุณาอนุญาตการเข้าถึงรูปภาพในเครื่อง');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent.coordinate;
    setMarkerCoord(coord);
  };

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setLocationName(preset.name);
    setMarkerCoord({ latitude: preset.lat, longitude: preset.lon });
    if (!imageUri || imageUri.startsWith('http')) {
      setImageUri(preset.image);
    }
  };

  const handleToggleAutoNotification = async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'ต้องการสิทธิ์แจ้งเตือน',
          'กรุณาอนุญาต Notification บนอุปกรณ์เพื่อรับการแจ้งเตือนเมื่อถึงเวลากิจกรรม'
        );
        setAutoScheduleNotification(false);
        return;
      }
    }
    setAutoScheduleNotification(enabled);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อกิจกรรม');
      return;
    }
    if (!locationName.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณาระบุชื่อสถานที่จัดกิจกรรม');
      return;
    }

    const xpNum = parseInt(rewardXp, 10) || 150;
    const coinsNum = parseInt(rewardCoins, 10) || 50;
    const timeRange = `${startTime} - ${endTime} น.`;

    // คำนวณเวลาเริ่มต้น (startsAt) จากเวลา startTime ที่ผู้ใช้กรอกจริง (เช่น 14:30)
    const now = new Date();
    const timeParts = startTime.trim().split(/[:.]/);
    const startHour = parseInt(timeParts[0], 10);
    const startMinute = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;

    let targetStartDate = new Date(now);
    if (!isNaN(startHour)) {
      targetStartDate.setHours(startHour, isNaN(startMinute) ? 0 : startMinute, 0, 0);
      // หากเวลาที่ตั้งผ่านไปแล้วในวันนี้ ให้ถือว่าเป็นเวลาของวันพรุ่งนี้
      if (targetStartDate.getTime() <= now.getTime()) {
        targetStartDate.setDate(targetStartDate.getDate() + 1);
      }
    } else {
      // หากกรอกไม่ถูก format ให้เริ่มในอีก 30 นาที
      targetStartDate = new Date(now.getTime() + 30 * 60 * 1000);
    }

    // คำนวณเวลาสิ้นสุด (endsAt) จาก endTime
    const endTimeParts = endTime.trim().split(/[:.]/);
    const endHour = parseInt(endTimeParts[0], 10);
    const endMinute = endTimeParts.length > 1 ? parseInt(endTimeParts[1], 10) : 0;
    let targetEndDate = new Date(targetStartDate);
    if (!isNaN(endHour)) {
      targetEndDate.setHours(endHour, isNaN(endMinute) ? 0 : endMinute, 0, 0);
      if (targetEndDate.getTime() <= targetStartDate.getTime()) {
        targetEndDate.setDate(targetEndDate.getDate() + 1);
      }
    } else {
      targetEndDate = new Date(targetStartDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const startsAt = targetStartDate.toISOString();
    const endsAt = targetEndDate.toISOString();

    // Default image if none provided
    const finalImage = imageUri || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80';

    try {
      setIsSubmitting(true);
      await createCampusEvent({
        title: title.trim(),
        description: description.trim() || 'กิจกรรมที่ผู้ใช้สร้างขึ้นเพื่อการสำรวจและเช็กอิน',
        category,
        locationName: locationName.trim(),
        latitude: markerCoord.latitude,
        longitude: markerCoord.longitude,
        startsAt,
        endsAt,
        timeRangeText: timeRange,
        rewardXp: xpNum,
        rewardCoins: coinsNum,
        imageUrl: finalImage,
        autoScheduleNotification,
      });

      const notifyTimeStr = targetStartDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      Alert.alert(
        '🎉 สร้างกิจกรรมสำเร็จ!',
        `กิจกรรม "${title}" (${timeRange}) ถูกเพิ่มลงในระบบและปักหมุดภารกิจลงในแผนที่แล้ว!\n\n${
          autoScheduleNotification
            ? `🔔 ระบบตั้งการแจ้งเตือนไว้ในเวลา ${notifyTimeStr} น.`
            : '🔕 ไม่ได้เปิดการแจ้งเตือน'
        }`
      );

      // Reset
      setTitle('');
      setDescription('');
      onClose();
    } catch (e) {
      Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างกิจกรรมได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="add-circle" size={22} color="#38bdf8" />
              </View>
              <Text style={styles.headerTitle}>สร้างกิจกรรมใหม่ (Create Event)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Event Photo Picker */}
            <Text style={styles.label}>🖼️ รูปภาพหน้าปกกิจกรรม (Event Cover)</Text>
            <TouchableOpacity style={styles.imagePickerBox} onPress={handlePickImage}>
              {imageUri ? (
                <View style={{ width: '100%', height: 160, position: 'relative' }}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.changeImageBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                    <Text style={styles.changeImageText}>แตะเพื่อเปลี่ยนรูป (หรือเลือกจากเครื่อง)</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#38bdf8" />
                  <Text style={styles.uploadPlaceholderText}>แตะเพื่อเลือกรูปภาพจากเครื่อง</Text>
                  <Text style={styles.uploadPlaceholderSub}>หรือแตะเลือกสถานที่ด้านล่างเพื่อใช้รูปอัตโนมัติ</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Presets Photo Shortcuts */}
            <Text style={styles.presetLabel}>รูปถ่ายสถานที่จริงรอบ มข. (แตะเพื่อเลือกด่วน):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
              {PRESET_LOCATIONS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={[
                    styles.presetChip,
                    locationName === preset.name && styles.presetChipActive,
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      locationName === preset.name && styles.presetChipTextActive,
                    ]}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.label}>ชื่อกิจกรรม / Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น KKU Hackathon หรือ กิจกรรมดนตรีในสวน"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            {/* Time Selection (ช่วงเวลากิจกรรม) */}
            <Text style={styles.label}>⏰ กำหนดช่วงเวลากิจกรรม (Time Range)</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Text style={styles.timeSubLabel}>เริ่มตั้งแต่กี่โมง</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="09:00"
                  placeholderTextColor="#64748b"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>

              <Text style={styles.timeSeparator}>ถึง</Text>

              <View style={styles.timeCol}>
                <Text style={styles.timeSubLabel}>สิ้นสุดกี่โมง</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="12:00"
                  placeholderTextColor="#64748b"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            {/* Category */}
            <Text style={styles.label}>หมวดหมู่</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, category === cat && styles.catBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Interactive Map Picker */}
            <View style={styles.mapLabelRow}>
              <Text style={styles.label}>🗺️ เลือกและปักหมุดสถานที่บนแผนที่</Text>
              <TouchableOpacity onPress={() => setIsMapExpanded(!isMapExpanded)}>
                <Text style={styles.expandMapText}>
                  {isMapExpanded ? 'ย่อแผนที่' : 'ขยายแผนที่'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.mapHintText}>
              แตะบนแผนที่เพื่อย้ายตำแหน่งหมุดพิกัดภารกิจเช็กอินได้ทันที
            </Text>

            <View style={[styles.mapContainer, isMapExpanded && { height: 260 }]}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: markerCoord.latitude,
                  longitude: markerCoord.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                onPress={handleMapPress}
              >
                <Marker
                  coordinate={markerCoord}
                  title="จุดจัดกิจกรรม"
                  description={locationName}
                  draggable
                  onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
                />
              </MapView>

              <View style={styles.coordFloatingBadge}>
                <Text style={styles.coordText}>
                  📍 {markerCoord.latitude.toFixed(4)}, {markerCoord.longitude.toFixed(4)}
                </Text>
              </View>
            </View>

            {/* Location Name */}
            <Text style={styles.label}>ชื่อสถานที่จัดงาน (Location Name) *</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น วิทยาลัยการคอมพิวเตอร์ หรือ บึงสีฐาน"
              placeholderTextColor="#64748b"
              value={locationName}
              onChangeText={setLocationName}
            />

            {/* Description */}
            <Text style={styles.label}>รายละเอียดกิจกรรม</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="อธิบายกิจกรรมและเป้าหมายในการเช็กอิน..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Rewards */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>รางวัล (XP)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={rewardXp}
                  onChangeText={setRewardXp}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>รางวัล (Coins 🪙)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={rewardCoins}
                  onChangeText={setRewardCoins}
                />
              </View>
            </View>

            {/* Auto Schedule Notification Switch */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>🔔 ตั้งการแจ้งเตือนอัตโนมัติ (W11)</Text>
                <Text style={styles.switchSub}>
                  ระบบจะแจ้งเตือนล่วงหน้าเมื่อถึงเวลาเริ่มกิจกรรม พร้อมปักหมุดภารกิจเช็กอิน
                </Text>
              </View>
              <Switch
                value={autoScheduleNotification}
                onValueChange={handleToggleAutoNotification}
                trackColor={{ false: '#334155', true: '#0284c7' }}
                thumbColor={autoScheduleNotification ? '#38bdf8' : '#f4f3f4'}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'กำลังสร้างกิจกรรม...' : 'ยืนยันสร้างกิจกรรม & ปักหมุด'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingBottom: 30,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  imagePickerBox: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  previewImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadPlaceholder: {
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  uploadPlaceholderText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  uploadPlaceholderSub: {
    color: '#64748b',
    fontSize: 11,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeCol: {
    flex: 1,
  },
  timeSubLabel: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeSeparator: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },
  multilineInput: {
    height: 65,
    textAlignVertical: 'top',
  },
  catRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  catBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  catBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  catBtnTextActive: {
    color: '#fff',
  },
  mapLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  expandMapText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  mapHintText: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 8,
  },
  mapContainer: {
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  coordFloatingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coordText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  presetLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  presetChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  presetChipText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  presetChipTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  switchSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 35,
    marginTop: 10,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
