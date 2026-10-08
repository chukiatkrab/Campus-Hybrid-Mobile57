# 🎮 CampusQuest: The Real-world RPG & Explorer
> **Capstone Project — หลักสูตรการพัฒนาโมบายล์แอปพลิเคชันแบบ Cross-platform 14 สัปดาห์**
> สถาปัตยกรรม: React Native 0.86 + Expo SDK 57 (Expo Router v4/v5)

---

## 🌟 คอนเซปต์หลัก (Core Concept)
แอปพลิเคชันแนว **Gamification & Real-world Exploration** ผสานแผนที่ในโลกจริง (GPS/Maps) เข้ากับระบบเกมสวมบทบาท (RPG) โดยผู้เล่นคือนักศึกษา/นักสำรวจที่ต้องออกเดินทางไปยังสถานที่จริงรอบมหาวิทยาลัยขอนแก่นและตัวเมือง ตรวจจับเรดาร์ภารกิจ สแกนพื้นที่ด้วยกล้อง AR/HUD ถ่ายภาพหลักฐานเพื่อรับค่าประสบการณ์ (XP), เหรียญทอง (Coins) และเหรียญตราไอเทมพิเศษเข้าสู่กระเป๋าเดินทาง

---

## 🧭 การบูรณาการครอบคลุมหลักสูตร 14 สัปดาห์

| สัปดาห์ | หัวข้อหลัก | การประยุกต์ใช้ใน CampusQuest |
| :--- | :--- | :--- |
| **สัปดาห์ 1** | Expo CLI, Architecture & Setup | รันบน Expo SDK 57 ล่าสุด พร้อมรองรับการรันทั้ง iOS, Android และ Web |
| **สัปดาห์ 2** | Components, Props & State | ออกแบบ UI ตัวละคร, การ์ดเควสต์, ระบบ Props และ useState ภายในหน้าจอ |
| **สัปดาห์ 3** | Styling, Flexbox, Dark Mode & Safe Area | ดีไซน์สไตล์ Cyber-Fantasy Explorer (Cyber Dark Theme), หลอดเลือด/หลอด XP, Safe Area Insets |
| **สัปดาห์ 4** | Expo Router (File-based Routing) | ใช้ Tabs Navigation (`_layout.tsx`) ร่วมกับ Dynamic Routing |
| **สัปดาห์ 5** | Form & State Management | จัดการ Global Game State ด้วย **Zustand** (XP, Level, Coins, Inventory, Quest Progress) |
| **สัปดาห์ 6** | Networking & FlatList | ดึงข้อมูลเควสต์ รายการไอเทม แสดงผลด้วย FlatList พร้อมระบบ RefreshControl |
| **สัปดาห์ 7** | Storage & Offline-First | บันทึกสถานะเกมถาวรลงเครื่องด้วย **AsyncStorage (Zustand Persist Middleware)** เล่นแบบออฟไลน์ได้ 100% |
| **สัปดาห์ 8** | Authentication & Security | โมดูลความปลอดภัย และจัดเก็บ Token ด้วย **Expo SecureStore** |
| **สัปดาห์ 9** | Camera, Permissions & Proofs | หน้า **Quest Scanner HUD**: ขอสิทธิ์กล้อง, กรอบเล็ง Sci-fi Reticle, พิกัด GPS ซ้อนทับ และถ่ายรูปส่งเควสต์ |
| **สัปดาห์ 10** | Location & Maps | แผนที่ **Quest Radar Map** ด้วย `react-native-maps`, คำนวณระยะทางแบบ **Haversine Formula**, วงรัศมีตรวจจับ Circle Zone |
| **สัปดาห์ 11** | Notifications & Platform APIs | ระบบ **Haptics** สั่นเตือนเมื่อเข้าใกล้เป้าหมาย + **Local Notifications** แจ้งเตือนเมื่อสำเร็จเควสต์หรือเลเวลอัป |
| **สัปดาห์ 12** | Clean Architecture & Performance | จัดระเบียบโค้ดแบบ Feature-based, ปรับแต่ง Performance ด้วย `useMemo` และ `useCallback` ลดการ Re-render พิกัด |
| **สัปดาห์ 13** | Unit & Integration Testing | ฟังก์ชันคณิตศาสตร์และตรรกะเกมแยกอิสระ (`gameMath.ts`) รองรับการทดสอบด้วย Jest |
| **สัปดาห์ 14** | EAS Build & APK Packaging | กำหนดค่า `eas.json` พร้อมสำหรับคำสั่ง `eas build -p android --profile preview` ออกเป็นไฟล์ `.apk` |

---

## 🎯 ฟีเจอร์พิเศษสำหรับการพรีเซนต์ (Demo Showcase Mode)
- **Simulation / Teleport Switch:** มีสวิตช์จำลอง GPS บนหน้าจอแผนที่ ให้ผู้ใช้งานสามารถกดปุ่ม **"🌀 วาร์ปมาจุดนี้"** เพื่อจำลองว่าเดินมาถึงจุดทำเควสต์แล้ว ช่วยให้สามารถสาธิตฟังก์ชันถ่ายภาพและรับรางวัลในห้องพรีเซนต์ได้ทันทีโดยไม่ต้องเดินออกไปกลางแจ้งจริง
