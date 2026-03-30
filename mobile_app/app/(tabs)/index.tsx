import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

/* ---------------- ROUTE TYPES ---------------- */
type TabRoute =
  | "/(tabs)/live-dashboard"
  | "/(tabs)/prediction-dashboard"
  | "/(tabs)/chart-dashboard"
  | "/(tabs)/schedule";

export default function Home() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  /* ---------------- COMPONENT: DASHBOARD CARD ---------------- */
  const NavCard = ({
    title,
    subtitle,
    route,
    icon,
    color,
  }: {
    title: string;
    subtitle: string;
    route: TabRoute;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(route)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="rgb(253, 160, 98)" />

      {/* ---------------- HEADER SECTION ---------------- */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>Welcome,</Text>
            <Text style={styles.userEmail}>
              {user?.email ? user.email.split("@")[0] : "User"}
            </Text>
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ---------------- BODY SECTION ---------------- */}
      <View style={styles.bodyContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 1. APP LOGO */}
          <Image
            source={require("../../assets/images/jogging.avif")}
            style={styles.logo}
          />

          {/* 2. APP NAME (NEW ADDITION) */}
          <Text style={styles.appName}>EcoRun</Text>

          {/* 3. DASHBOARD TITLE */}
          <Text style={styles.sectionTitle}>Dashboard</Text>

          <NavCard
            icon="speedometer-outline"
            title="Live Monitor"
            subtitle="Real-time sensor readings"
            route="/(tabs)/live-dashboard"
            color="#4CC9F0" // Cyan
          />

          <NavCard
            icon="analytics-outline"
            title="Predictions"
            subtitle="Future environment forecast"
            route="/(tabs)/prediction-dashboard"
            color="#F72585" // Pink
          />

          <NavCard
            icon="bar-chart-outline"
            title="Analytics"
            subtitle="Historical trends & data"
            route="/(tabs)/chart-dashboard"
            color="#7209B7" // Purple
          />

          <NavCard
            icon="calendar-outline"
            title="Smart Schedule"
            subtitle="Plan best time to jog"
            route="/(tabs)/schedule"
            color="#06D6A0" // Green/Teal
          />
        </ScrollView>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "rgb(253, 160, 98)",
  },
  /* Header Styles */
  headerSafe: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  greetingText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  userEmail: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "capitalize",
  },
  /* Logout Styles */
  logoutBtn: {
    backgroundColor: "rgb(255, 120, 30)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  /* Body Styles */
  bodyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },

  /* --- IMAGE & BRANDING STYLES --- */
  logo: {
    width: 140,
    height: 140,
    alignSelf: "center",
    marginBottom: 5, // Reduced margin to pull name closer
    marginTop: 10,
  },
  appName: {
    fontSize: 32, // Big and bold
    fontWeight: "800", // Extra bold
    color: "rgb(255, 120, 30)", // Matches your specific Orange Theme
    alignSelf: "center",
    marginBottom: 25, // Space before the Dashboard title
    letterSpacing: 1,
  },
  /* ------------------------------- */

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    marginLeft: 4,
  },
  /* Card Styles */
  card: {
    backgroundColor: "#f4f6fb",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  cardSub: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
});
