import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth } from "../../firebaseConfig";

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Error States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");

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

  /* ---------- EMAIL SIGNUP ---------- */
  const handleSignup = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // Navigate to tabs or profile setup after successful signup
      router.replace("/(tabs)");
    } catch (error: any) {
      const errCode = error.code;
      switch (errCode) {
        case "auth/email-already-in-use":
          setAuthError("This email is already in use.");
          break;
        case "auth/invalid-email":
          setAuthError("Invalid email address.");
          break;
        case "auth/weak-password":
          setAuthError("Password is too weak.");
          break;
        default:
          setAuthError("Signup failed. Please try again.");
          console.log(error);
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

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

        {/* Password Input with Toggle */}
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

        {/* General Auth Error */}
        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        {/* Signup Button */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Switch to Login */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.switchLink}> Login</Text>
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
    backgroundColor: "rgb(253, 160, 98)", // Matched LoginScreen background
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
    backgroundColor: "rgb(255, 120, 30)", // Matched LoginScreen button color
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
