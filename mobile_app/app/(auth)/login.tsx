import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../../firebaseConfig";

// It closes the browser popup after login
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");

  /* ---------------- GOOGLE AUTH (FIXED) ---------------- */
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use 'clientId' only. This forces the Web ID for Expo Go.
    clientId:
      "461383637174-u1i01846qhgb8jjqa577g98qaka4rq1g.apps.googleusercontent.com",

    // Force the redirect to the proxy
    redirectUri: "https://auth.expo.io/@MalindaBoteju/air-monitor-app",
  });

  /* ---------- GOOGLE RESPONSE ---------- */
  useEffect(() => {
    if (response?.type === "success") {
      const { idToken } = response.authentication ?? {};

      if (!idToken) {
        Alert.alert("Google Error", "No ID token received");
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch((err: any) =>
        Alert.alert("Google Sign-In Error", err.message),
      );
    } else if (response?.type === "error") {
      Alert.alert(
        "Google Auth Error",
        response.error?.message || "Unknown error",
      );
    }
  }, [response]);

  /* ---------- AUTH LISTENER ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/(tabs)");
    });
    return unsub;
  }, []);

  /* ---------- VALIDATION ---------- */
  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setAuthError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    return valid;
  };

  /* ---------- EMAIL LOGIN ---------- */
  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const err = error as any;

      switch (err.code) {
        case "auth/user-not-found":
          setAuthError("No account found with this email");
          break;
        case "auth/wrong-password":
          setAuthError("Incorrect password");
          break;
        case "auth/invalid-credential":
          setAuthError("Invalid login credentials");
          break;
        case "auth/too-many-requests":
          setAuthError("Too many attempts. Try again later");
          break;
        default:
          setAuthError("Something went wrong. Please try again");
          console.log(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require("../../assets/images/jogging.avif")}
          style={styles.logo}
        />

        <Text style={styles.title}>Welcome to EcoRun</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text style={styles.error}>{passwordError}</Text>
        ) : null}

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.or}>OR</Text>

        <TouchableOpacity
          style={styles.googleBtn}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.switchLink}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(253, 160, 98)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitle: {
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f1f3f6",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f6",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
  },
  error: {
    color: "#e63946",
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  button: {
    backgroundColor: "rgb(255, 120, 30)",
    padding: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  or: {
    textAlign: "center",
    color: "#aaa",
    marginVertical: 14,
  },
  googleBtn: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f1f3f6",
  },
  googleText: { textAlign: "center", fontWeight: "500" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  switchText: { color: "#777" },
  switchLink: {
    color: "rgb(255, 120, 30)",
    fontWeight: "bold",
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 10,
  },
});
