import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import {
  Layout,
  Text,
  Button,
  Card,
  Input,
  Avatar,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import usePersonelStore from "../store/personelStore";
import useAuthStore from "../store/authStore";

// Validation schema - Sadece çalışanın güncelleyebileceği alanlar
const profileSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Telefon numarası en az 10 karakter olmalıdır")
    .optional(),
  address: z
    .string()
    .max(500, "Adres en fazla 500 karakter olabilir")
    .optional(),
  profilePictureUrl: z.string().url("Geçerli bir URL giriniz").optional(),
});

const MyProfileScreen = () => {
  const { currentPersonel, fetchMyData, updateMyData, isLoading } =
    usePersonelStore();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const loadProfile = async () => {
      const result = await fetchMyData();
      if (result.success && result.employee) {
        setValue("phoneNumber", result.employee.phoneNumber || "");
        setValue("address", result.employee.address || "");
        setValue("profilePictureUrl", result.employee.profilePictureUrl || "");
      }
    };

    loadProfile();
  }, []);

  const onSubmit = async (data) => {
    try {
      // Boş stringleri undefined'a çevir
      const processedData = {};
      Object.keys(data).forEach((key) => {
        if (data[key] && data[key].trim()) {
          processedData[key] = data[key].trim();
        }
      });

      const result = await updateMyData(processedData);

      if (result.success) {
        Alert.alert("Başarılı", "Profil bilgileriniz güncellendi");
      } else {
        Alert.alert(
          "Hata",
          result.error || "Profil güncellenirken bir hata oluştu"
        );
      }
    } catch (error) {
      Alert.alert("Hata", "Beklenmeyen bir hata oluştu");
    }
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text category="s2" style={styles.infoLabel}>
        {label}:
      </Text>
      <Text category="p1" style={styles.infoValue}>
        {value || "Belirtilmemiş"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <Avatar
                size="giant"
                source={{
                  uri:
                    currentPersonel?.profilePictureUrl ||
                    `https://ui-avatars.com/api/?name=${currentPersonel?.firstName}+${currentPersonel?.lastName}&background=random`,
                }}
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Text category="h5" style={styles.name}>
                  {currentPersonel?.firstName} {currentPersonel?.lastName}
                </Text>
                <Text category="s1" style={styles.position}>
                  {currentPersonel?.position}
                </Text>
                <Text category="c1" style={styles.department}>
                  {currentPersonel?.department}
                </Text>
              </View>
            </View>
          </Card>

          {/* Personal Information - Read Only */}
          <Card style={styles.infoCard}>
            <Text category="h6" style={styles.sectionTitle}>
              Kişisel Bilgiler
            </Text>

            <InfoRow label="Ad" value={currentPersonel?.firstName} />
            <InfoRow label="Soyad" value={currentPersonel?.lastName} />
            <InfoRow label="Email" value={currentPersonel?.email} />
            <InfoRow label="TC Kimlik No" value={currentPersonel?.tcKimlikNo} />
            <InfoRow
              label="Doğum Tarihi"
              value={currentPersonel?.dateOfBirth}
            />
            <InfoRow label="Cinsiyet" value={currentPersonel?.gender} />
          </Card>

          {/* Work Information - Read Only */}
          <Card style={styles.infoCard}>
            <Text category="h6" style={styles.sectionTitle}>
              İş Bilgileri
            </Text>

            <InfoRow
              label="Personel Kodu"
              value={currentPersonel?.employeeCode}
            />
            <InfoRow label="Pozisyon" value={currentPersonel?.position} />
            <InfoRow label="Departman" value={currentPersonel?.department} />
            <InfoRow
              label="Sözleşme Türü"
              value={currentPersonel?.contractType}
            />
            <InfoRow
              label="Günlük Çalışma Saati"
              value={currentPersonel?.workingHoursPerDay}
            />
            <InfoRow
              label="İşe Başlama Tarihi"
              value={currentPersonel?.startDate}
            />
            <InfoRow
              label="Maaş"
              value={
                currentPersonel?.salary
                  ? `${currentPersonel.salary.toLocaleString()} TL`
                  : undefined
              }
            />
          </Card>

          {/* Editable Information */}
          <Card style={styles.editCard}>
            <Text category="h6" style={styles.sectionTitle}>
              Güncellenebilir Bilgiler
            </Text>

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Telefon Numarası"
                  placeholder="0555 123 4567"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  status={errors.phoneNumber ? "danger" : "basic"}
                  caption={errors.phoneNumber?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Adres"
                  placeholder="Tam adres"
                  value={value}
                  onChangeText={onChange}
                  multiline={true}
                  numberOfLines={3}
                  status={errors.address ? "danger" : "basic"}
                  caption={errors.address?.message}
                  style={styles.input}
                />
              )}
            />

            <Controller
              control={control}
              name="profilePictureUrl"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Profil Fotoğrafı URL"
                  placeholder="https://example.com/photo.jpg"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="url"
                  autoCapitalize="none"
                  status={errors.profilePictureUrl ? "danger" : "basic"}
                  caption={errors.profilePictureUrl?.message}
                  style={styles.input}
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.updateButton}
            >
              {isLoading ? "Güncelleniyor..." : "Bilgileri Güncelle"}
            </Button>
          </Card>
        </ScrollView>

        <Button
          style={styles.logoutButton}
          status="danger"
          appearance="outline"
          onPress={handleLogout}
        >
          Çıkış Yap
        </Button>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    marginBottom: 4,
  },
  position: {
    marginBottom: 2,
    color: "#666",
  },
  department: {
    color: "#999",
  },
  infoCard: {
    marginBottom: 16,
  },
  editCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    color: "#666",
    fontWeight: "600",
    minWidth: 120,
  },
  infoValue: {
    flex: 1,
    color: "#333",
  },
  input: {
    marginBottom: 16,
  },
  updateButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default MyProfileScreen;
