import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/storage/useAuthStore';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Form states
  const [username, setUsername] = useState('chukiat');
  const [password, setPassword] = useState('1234');
  const [name, setName] = useState('นายชูเกียรติ คำมณีจันทร์');
  const [email, setEmail] = useState('chukiat.ka@kkumail.com');
  const [studentId, setStudentId] = useState('663450174-1');

  const handleSubmit = async () => {
    if (isRegisterMode) {
      const res = await register({
        username,
        password,
        name,
        email,
        studentId,
        department: 'วิทยาการคอมพิวเตอร์และสารสนเทศ มข.',
      });
      if (res.success) {
        Alert.alert('สำเร็จ', res.message);
        onClose();
      } else {
        Alert.alert('แจ้งเตือน', res.message);
      }
    } else {
      const res = await login(username, password);
      if (res.success) {
        Alert.alert('ยินดีต้อนรับ', `เข้าสู่ระบบในชื่อ ${username} สำเร็จ!`);
        onClose();
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', res.message);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={isRegisterMode ? 'person-add' : 'lock-closed'}
                  size={20}
                  color="#38bdf8"
                />
              </View>
              <Text style={styles.headerTitle}>
                {isRegisterMode ? 'ลงทะเบียนนักสำรวจใหม่' : 'เข้าสู่ระบบ CampusQuest'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            {isRegisterMode && (
              <>
                <Text style={styles.label}>ชื่อ-นามสกุล *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น นายชูเกียรติ คำมณีจันทร์"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.label}>รหัสนักศึกษา</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น 663450174-1"
                  placeholderTextColor="#64748b"
                  value={studentId}
                  onChangeText={setStudentId}
                />

                <Text style={styles.label}>อีเมลสถาบัน (KKU Mail)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น chukiat.ka@kkumail.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </>
            )}

            <Text style={styles.label}>ชื่อผู้ใช้ (Username) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>รหัสผ่าน (Password) *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitBtnText}>
                {isLoading
                  ? 'กำลังประมวลผล...'
                  : isRegisterMode
                  ? 'สร้างบัญชี & เริ่มสำรวจ'
                  : 'เข้าสู่ระบบ (Sign In)'}
              </Text>
            </TouchableOpacity>

            {/* Toggle Mode */}
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setIsRegisterMode(!isRegisterMode)}
            >
              <Text style={styles.toggleBtnText}>
                {isRegisterMode
                  ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่'
                  : 'ยังไม่มีบัญชีนักสำรวจ? ลงทะเบียนใหม่'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  toggleBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
});
