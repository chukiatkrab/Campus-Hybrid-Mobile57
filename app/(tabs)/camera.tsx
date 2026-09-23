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

type FilterType = "normal" | "bw" | "vivid";

const filters: { id: FilterType; name: string }[] = [
  { id: "normal", name: "Normal" },
  { id: "bw", name: "B&W" },
  { id: "vivid", name: "Vivid" },
];

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const [image, setImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("normal");
  const [facing, setFacing] = useState<"back" | "front">("back");

  const cameraRef = useRef<React.ComponentRef<typeof CameraView>>(null);

  // -----------------------------
  // Permission Check
  // -----------------------------
  if (!cameraPermission) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading Camera...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.iconCircle}>
          <Ionicons name="camera" size={54} color="#0a7ea4" />
        </View>

        <Text style={styles.permissionTitle}>Camera Access</Text>

        <Text style={styles.permissionDescription}>
          Allow camera access to capture your special moments and places.
        </Text>

        <Pressable
          style={styles.allowButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.allowButtonText}>Allow Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // -----------------------------
  // Actions
  // -----------------------------
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo: CameraCapturedPicture | undefined =
        await cameraRef.current.takePictureAsync({
          quality: 0.9,
          exif: false,
        });

      if (photo?.uri) {
        setImage(photo.uri);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Camera Error", "Unable to take the photo.");
    }
  };

  const retakePicture = () => {
    setImage(null);
    setSelectedFilter("normal");
  };

  const saveImage = async () => {
    if (!image) return;

    try {
      let currentMediaPerm = mediaPermission;
      if (!currentMediaPerm?.granted) {
        currentMediaPerm = await requestMediaPermission();
      }

      if (!currentMediaPerm?.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to save photos."
        );
        return;
      }

      await MediaLibrary.createAssetAsync(image);
      Alert.alert("Saved!", "Photo saved successfully to your gallery.");
    } catch (error) {
      console.log(error);
      Alert.alert("Save Failed", "Unable to save the photo.");
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // -----------------------------
  // Live Camera Screen
  // -----------------------------
  if (!image) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />

        <SafeAreaView style={styles.cameraOverlay} pointerEvents="box-none">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>CAMERA</Text>
              <Text style={styles.subtitle}>Capture your moment</Text>
            </View>

            <View style={styles.headerButtons}>
              <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
              </Pressable>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>

          {/* Focus Frame */}
          <View style={styles.focusFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Bottom Panel */}
          <View style={styles.bottomPanel}>
            <Text style={styles.sectionTitle}>FILTER</Text>

            <View style={styles.filterRow}>
              {filters.map((filter) => {
                const active = selectedFilter === filter.id;

                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => setSelectedFilter(filter.id)}
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {filter.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Shutter */}
            <Pressable style={styles.shutter} onPress={takePicture}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // -----------------------------
  // Preview Screen
  // -----------------------------
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: image }}
        style={[
          styles.previewImage,
          selectedFilter === "bw" && styles.blackWhitePreview,
          selectedFilter === "vivid" && styles.vividPreview,
        ]}
      />

      {/* Vivid overlay */}
      {selectedFilter === "vivid" && (
        <View pointerEvents="none" style={styles.vividOverlay} />
      )}

      {/* B&W overlay */}
      {selectedFilter === "bw" && (
        <View pointerEvents="none" style={styles.bwOverlay} />
      )}

      <SafeAreaView style={styles.previewOverlay}>
        {/* Preview Header */}
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>PHOTO PREVIEW</Text>

          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {filters.find((f) => f.id === selectedFilter)?.name}
            </Text>
          </View>
        </View>

        {/* Preview Bottom */}
        <View style={styles.previewBottom}>
          <Text style={styles.sectionTitle}>CHOOSE FILTER</Text>

          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const active = selectedFilter === filter.id;

              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setSelectedFilter(filter.id)}
                  style={[
                    styles.filterButton,
                    active && styles.filterButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {filter.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable style={styles.retakeButton} onPress={retakePicture}>
              <Text style={styles.retakeText}>RETAKE</Text>
            </Pressable>

            <Pressable style={styles.saveButton} onPress={saveImage}>
              <Text style={styles.saveText}>SAVE PHOTO</Text>
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
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
    marginRight: 6,
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  focusFrame: {
    alignSelf: "center",
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
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
  bottomPanel: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 25,
    alignItems: "center",
  },
  sectionTitle: {
    color: "#888",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  filterButtonActive: {
    backgroundColor: "#0a7ea4",
  },
  filterText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#fff",
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
  blackWhitePreview: {
    opacity: 0.85,
  },
  vividPreview: {},
  bwOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  vividOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,120,20,0.08)",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
  },
  previewHeader: {
    paddingHorizontal: 22,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  filterBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  previewBottom: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 25,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  retakeButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  retakeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  saveButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(10,126,164,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  permissionDescription: {
    color: "#999",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  allowButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
  },
  allowButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
