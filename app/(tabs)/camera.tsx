import React, { useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import {
  CameraView,
  CameraCapturedPicture,
  useCameraPermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGameStore } from "@/storage/useGameStore";

type FilterType = "hud" | "normal" | "night";

export default function QuestCameraScreen() {
  const router = useRouter();
  const { questId, questTitle } = useLocalSearchParams<{ questId?: string; questTitle?: string }>();

  const completeQuest = useGameStore((s) => s.completeQuest);
  const activeQuest = useGameStore((s) => s.quests.find((q) => q.id === questId));

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const [image, setImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavedLocally, setIsSavedLocally] = useState(false);

  const cameraRef = useRef<React.ComponentRef<typeof CameraView>>(null);

  if (!cameraPermission) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Initializing Quest Scanner...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.iconCircle}>
          <Ionicons name="scan-circle" size={60} color="#38bdf8" />
        </View>
        <Text style={styles.permissionTitle}>Camera HUD Access</Text>
        <Text style={styles.permissionDescription}>
          เปิดสิทธิ์ใช้งานกล้องเพื่อสแกนพื้นที่และถ่ายภาพหลักฐานการทำภารกิจ
        </Text>
        <Pressable style={styles.allowButton} onPress={requestCameraPermission}>
          <Text style={styles.allowButtonText}>อนุญาตการเข้าถึงกล้อง</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo: CameraCapturedPicture | undefined = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        exif: false,
      });
      if (photo?.uri) {
        setImage(photo.uri);
        setIsSavedLocally(false);
      }
    } catch (error) {
      Alert.alert("Camera Error", "ไม่สามารถบันทึกภาพได้");
    }
  };

  const retakePicture = () => {
    setImage(null);
    setIsSavedLocally(false);
  };

  // บันทึกรูปลง Gallery มือถือแยกต่างหาก
  const handleSaveToGallery = async () => {
    if (!image) return;

    try {
      let currentMediaPerm = mediaPermission;
      if (!currentMediaPerm?.granted) {
        currentMediaPerm = await requestMediaPermission();
      }

      if (!currentMediaPerm?.granted) {
        Alert.alert(
          "ต้องการสิทธิ์",
          "กรุณาอนุญาตการเข้าถึง Photo Library เพื่อบันทึกรูปภาพลงในเครื่อง"
        );
        return;
      }

      await MediaLibrary.createAssetAsync(image);
      setIsSavedLocally(true);
      Alert.alert("💾 บันทึกสำเร็จ!", "บันทึกภาพถ่ายลงในแกลเลอรีรูปภาพของเครื่องเรียบร้อยแล้ว");
    } catch (error) {
      Alert.alert("บันทึกล้มเหลว", "ไม่สามารถบันทึกรูปลงเครื่องได้");
    }
  };

  const submitQuestProof = async () => {
    if (!image) return;

    try {
      setIsSubmitting(true);

      // บันทึกรูปลง Gallery ผู้ใช้อัตโนมัติ (หากได้รับสิทธิ์)
      if (mediaPermission?.granted) {
        try {
          await MediaLibrary.createAssetAsync(image);
          setIsSavedLocally(true);
        } catch (e) {}
      }

      // ส่งผลเควสต์เข้า Game Store
      const targetId = questId || (activeQuest ? activeQuest.id : "q-kku-gate");
      const res = await completeQuest(targetId, image);

      Alert.alert(
        "🎉 ส่งหลักฐานภารกิจสำเร็จ!",
        `รูปภาพถูกบันทึกเรียบร้อย และคุณได้รับ +${res.xpGained} XP ${res.leveledUp ? `\n🌟 ยินดีด้วย! เลเวลอัปเป็น Lv.${res.newLevel}!` : ""}`,
        [
          {
            text: "ดูบนแผนที่",
            onPress: () => router.replace("/(tabs)"),
          },
          {
            text: "ไปหน้ากระเป๋าไอเทม",
            onPress: () => router.replace("/(tabs)/profile"),
          },
        ]
      );
    } catch (e) {
      Alert.alert("ผิดพลาด", "ไม่สามารถส่งหลักฐานได้ในขณะนี้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((cur) => (cur === "back" ? "front" : "back"));
  };

  // Live Camera Viewfinder
  if (!image) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

        {/* Sci-Fi Scanner Overlay */}
        <SafeAreaView style={styles.cameraOverlay} pointerEvents="box-none">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={styles.liveDot} />
                <Text style={styles.logo}>QUEST SCANNER</Text>
              </View>
              <Text style={styles.subtitle}>
                {questTitle ? `ภารกิจ: ${questTitle}` : "โหมดสแกนหลักฐานพิกัด"}
              </Text>
            </View>

            <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Scanner Reticle Frame */}
          <View style={styles.reticleContainer}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={styles.centerCross}>
              <Ionicons name="scan" size={40} color="rgba(56, 189, 248, 0.6)" />
            </View>
            <Text style={styles.scannerCoords}>LAT: 16.4730° N | LON: 102.8206° E</Text>
          </View>

          {/* Bottom Panel */}
          <View style={styles.bottomPanel}>
            <Text style={styles.sectionTitle}>
              {questTitle ? `จัดวางวัตถุเป้าหมายให้อยู่ในกรอบเล็ง` : `ถ่ายภาพเพื่อบันทึกประวัติการสำรวจ`}
            </Text>

            <Pressable style={styles.shutter} onPress={takePicture}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Preview & Submit Proof Screen
  return (
    <View style={styles.container}>
      <Image source={{ uri: image }} style={styles.previewImage} />

      {/* Futuristic Watermark Overlay */}
      <View style={styles.watermarkOverlay}>
        <View style={styles.watermarkBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#38bdf8" />
          <Text style={styles.watermarkText}>CAMPUSQUEST PROOF VERIFIED</Text>
        </View>
        <Text style={styles.watermarkDate}>
          {new Date().toLocaleString("th-TH")} • GPS VERIFIED
        </Text>
      </View>

      <SafeAreaView style={styles.previewOverlay}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>ตรวจสอบและบันทึกภาพถ่าย</Text>

          {isSavedLocally && (
            <View style={styles.savedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.savedBadgeText}>บันทึกลงเครื่องแล้ว</Text>
            </View>
          )}
        </View>

        <View style={styles.previewBottom}>
          <Text style={styles.previewQuestName}>
            {questTitle || activeQuest?.title || "ภาพถ่ายหลักฐานการสำรวจ"}
          </Text>
          <Text style={styles.previewQuestDesc}>
            คุณสามารถบันทึกรูปลงเครื่อง หรือส่งเป็นหลักฐานภารกิจเพื่อรับรางวัล XP & Coins
          </Text>

          {/* Secondary Action: Save to Device Gallery */}
          <Pressable
            style={[styles.saveGalleryBtn, isSavedLocally && styles.saveGalleryBtnDone]}
            onPress={handleSaveToGallery}
          >
            <Ionicons
              name={isSavedLocally ? "checkmark-circle" : "download-outline"}
              size={18}
              color={isSavedLocally ? "#22c55e" : "#38bdf8"}
            />
            <Text style={[styles.saveGalleryText, isSavedLocally && { color: "#22c55e" }]}>
              {isSavedLocally ? "บันทึกลงแกลเลอรีเรียบร้อย" : "💾 บันทึกรูปลง Gallery ในเครื่อง"}
            </Text>
          </Pressable>

          {/* Main Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.retakeButton} onPress={retakePicture} disabled={isSubmitting}>
              <Text style={styles.retakeText}>ถ่ายใหม่</Text>
            </Pressable>

            <Pressable style={styles.submitButton} onPress={submitQuestProof} disabled={isSubmitting}>
              <Ionicons name="cloud-upload" size={18} color="#fff" />
              <Text style={styles.submitText}>
                {isSubmitting ? "กำลังส่ง..." : "ส่งหลักฐานรับรางวัล"}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loading: {
    flex: 1,
    backgroundColor: "#090d16",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "700",
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingBottom: 12,
  },
  logo: {
    color: "#38bdf8",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subtitle: {
    color: "#e2e8f0",
    fontSize: 12,
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  reticleContainer: {
    alignSelf: "center",
    width: 280,
    height: 280,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#38bdf8",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  centerCross: {
    opacity: 0.8,
  },
  scannerCoords: {
    position: "absolute",
    bottom: -28,
    color: "#38bdf8",
    fontSize: 10,
    fontFamily: "monospace",
    letterSpacing: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomPanel: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 25,
    alignItems: "center",
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 16,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  previewImage: {
    ...StyleSheet.absoluteFill,
    resizeMode: "cover",
  },
  watermarkOverlay: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  watermarkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  watermarkText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  watermarkDate: {
    color: "#cbd5e1",
    fontSize: 11,
    marginTop: 4,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  previewHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  savedBadgeText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "700",
  },
  previewBottom: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  previewQuestName: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
  },
  previewQuestDesc: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  saveGalleryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(2, 132, 199, 0.15)",
    borderWidth: 1,
    borderColor: "#0284c7",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  saveGalleryBtnDone: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "#22c55e",
  },
  saveGalleryText: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  retakeButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
  },
  retakeText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
  },
  submitButton: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#0284c7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: "#090d16",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  permissionDescription: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  allowButton: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  allowButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
