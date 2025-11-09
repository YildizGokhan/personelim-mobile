import React from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Layout, Text, Input, Button, Card } from "@ui-kitten/components";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAuthStore from "../store/authStore";

// Zod validation schema
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ad en az 2 karakter olmalıdır")
      .max(50, "Ad en fazla 50 karakter olabilir")
      .regex(
        /^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/,
        "Ad sadece harf ve boşluk içerebilir"
      ),
    email: z.string().email("Geçerli bir email adresi giriniz"),
    password: z
      .string()
      .min(6, "Şifre en az 6 karakter olmalıdır")
      .regex(/(?=.*[a-z])/, "Şifre en az bir küçük harf içermelidir")
      .regex(/(?=.*[A-Z])/, "Şifre en az bir büyük harf içermelidir")
      .regex(/(?=.*\d)/, "Şifre en az bir rakam içermelidir"),
    confirmPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    const result = await register(data.name, data.email, data.password);
    console.log("Registration result:", result);
    
    if (!result.success) {
      Alert.alert("Hata", result.error || "Kayıt olurken bir hata oluştu");
    }
  };

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Text category="h1" style={styles.title}>
          Kayıt Ol
        </Text>
        <Text category="s1" style={styles.subtitle}>
          Yeni hesap oluşturun
        </Text>

        <Card style={styles.card}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Ad Soyad"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                status={errors.name ? "danger" : "basic"}
                caption={errors.name?.message}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="default"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                status={errors.email ? "danger" : "basic"}
                caption={errors.email?.message}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Şifre"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                status={errors.password ? "danger" : "basic"}
                caption={
                  errors.password?.message ||
                  "En az 6 karakter, 1 büyük harf, 1 küçük harf, 1 rakam"
                }
                style={styles.input}
                secureTextEntry={!showPassword}
                accessoryRight={() => (
                  <Text
                    style={styles.passwordEye}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </Text>
                )}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Şifre Tekrarı"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                status={errors.confirmPassword ? "danger" : "basic"}
                caption={errors.confirmPassword?.message}
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                accessoryRight={() => (
                  <Text
                    style={styles.passwordEye}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? "🙈" : "👁"}
                  </Text>
                )}
              />
            )}
          />

          <Button
            style={styles.registerButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
          </Button>

          <Button
            style={styles.loginButton}
            appearance="ghost"
            onPress={() => navigation.navigate("Login")}
            disabled={isLoading}
          >
            Zaten hesabınız var mı? Giriş yapın
          </Button>
        </Card>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  loginButton: {
    marginBottom: 8,
  },
  passwordEye: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
});

export default RegisterScreen;
