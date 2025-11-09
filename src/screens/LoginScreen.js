import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Layout, Text, Input, Button, Card } from "@ui-kitten/components";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAuthStore from "../store/authStore";

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi giriniz"),
  password: z.string().min(1, "Şifre boş olamaz"),
});

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    
    if (!result.success) {
      Alert.alert("Hata", result.error || "Giriş yapılırken bir hata oluştu");
    }
  };

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Text category="h1" style={styles.title}>
          Personelim
        </Text>
        <Text category="s1" style={styles.subtitle}>
          Personel Takip Sistemi
        </Text>

        <Card style={styles.card}>
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
                caption={errors.password?.message}
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

          <Button
            style={styles.loginButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </Button>

          <Button
            style={styles.registerButton}
            appearance="ghost"
            onPress={() => navigation.navigate("Register")}
            disabled={isLoading}
          >
            Hesabınız yok mu? Kayıt olun
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
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  registerButton: {
    marginBottom: 8,
  },
  passwordEye: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
});

export default LoginScreen;
