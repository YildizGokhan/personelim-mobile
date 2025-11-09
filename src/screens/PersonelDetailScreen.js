import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import {
  Layout,
  Text,
  Button,
  Card,
  Divider,
  Avatar,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import usePersonelStore from "../store/personelStore";

const PersonelDetailScreen = ({ navigation, route }) => {
  const { personel } = route.params;
  const { deletePersonel, isLoading } = usePersonelStore();
  const [personelData, setPersonelData] = useState(personel);

  const personelId =
    personelData?.id ||
    personelData?._id ||
    personelData?.employeeId ||
    personelData?.userId;

  useEffect(() => {
    setPersonelData(personel);
  }, [personel]);

  const handleEdit = () => {
    navigation.navigate("AddPersonel", {
      mode: "edit",
      personel: personelData,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Personeli Sil",
      `${personelData.firstName} ${personelData.lastName} adlı personeli silmek istediğinizden emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            if (!personelId) {
              Alert.alert("Hata", "Personel kimliği bulunamadı.");
              return;
            }
            const result = await deletePersonel(personelId);
            if (result.success) {
              Alert.alert("Başarılı", "Personel başarıyla silindi", [
                {
                  text: "Tamam",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } else {
              Alert.alert(
                "Hata",
                result.error || "Personel silinirken bir hata oluştu"
              );
            }
          },
        },
      ]
    );
  };

  const handleCreateUser = () => {
    navigation.navigate("CreatePersonelUser", { personel: personelData });
  };

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelContainer}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#666"
            style={styles.infoIcon}
          />
        )}
        <Text category="s2" style={styles.infoLabel}>
          {label}:
        </Text>
      </View>
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
          {/* Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <Avatar
                size="giant"
                source={{
                  uri: `https://ui-avatars.com/api/?name=${personelData.firstName}+${personelData.lastName}&background=random`,
                }}
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Text category="h5" style={styles.name}>
                  {personelData.firstName} {personelData.lastName}
                </Text>
                <Text category="s1" style={styles.position}>
                  {personelData.position}
                </Text>
                <Text category="c1" style={styles.department}>
                  {personelData.department}
                </Text>
              </View>
            </View>
          </Card>

          {/* Contact Information */}
          <Card style={styles.infoCard}>
            <Text category="h6" style={styles.sectionTitle}>
              İletişim Bilgileri
            </Text>
            <Divider style={styles.divider} />

            <InfoRow
              label="Email"
              value={personelData.email}
              icon="mail-outline"
            />
            <InfoRow
              label="Telefon"
              value={personelData.phone}
              icon="call-outline"
            />
            <InfoRow
              label="Adres"
              value={personelData.address}
              icon="location-outline"
            />
            <InfoRow
              label="Acil Durum"
              value={personelData.emergencyContact}
              icon="alert-circle-outline"
            />
          </Card>

          {/* Work Information */}
          <Card style={styles.infoCard}>
            <Text category="h6" style={styles.sectionTitle}>
              İş Bilgileri
            </Text>
            <Divider style={styles.divider} />

            <InfoRow
              label="Pozisyon"
              value={personelData.position}
              icon="briefcase-outline"
            />
            <InfoRow
              label="Departman"
              value={personelData.department}
              icon="business-outline"
            />
            <InfoRow
              label="Maaş"
              value={
                personelData.salary
                  ? `${personelData.salary.toLocaleString()} TL`
                  : undefined
              }
              icon="card-outline"
            />
            <InfoRow
              label="İşe Başlama"
              value={personelData.startDate}
              icon="calendar-outline"
            />
            <InfoRow
              label="Durum"
              value={personelData.isDeleted ? "Pasif" : "Aktif"}
              icon="checkmark-circle-outline"
            />
          </Card>

          {/* User Account Information */}
          {personelData.userId ? (
            <Card style={styles.infoCard}>
              <Text category="h6" style={styles.sectionTitle}>
                Kullanıcı Hesabı
              </Text>
              <Divider style={styles.divider} />

              <InfoRow
                label="Hesap Durumu"
                value="Aktif"
                icon="person-outline"
              />
              <InfoRow
                label="Kullanıcı ID"
                value={personelData.userId}
                icon="key-outline"
              />
            </Card>
          ) : (
            <Card style={styles.infoCard}>
              <Text category="h6" style={styles.sectionTitle}>
                Kullanıcı Hesabı
              </Text>
              <Divider style={styles.divider} />

              <Text category="p2" style={styles.noUserText}>
                Bu personel için henüz kullanıcı hesabı oluşturulmamış
              </Text>
              <Button
                appearance="ghost"
                status="info"
                onPress={handleCreateUser}
                style={styles.createUserButton}
              >
                Kullanıcı Hesabı Oluştur
              </Button>
            </Card>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            appearance="outline"
            status="primary"
            onPress={handleEdit}
            style={styles.editButton}
          >
            Düzenle
          </Button>
          <Button
            appearance="outline"
            status="info"
            onPress={() =>
              navigation.navigate("EmployeeTimesheets", {
                employeeId: personelId,
                employeeName: `${personelData.firstName || ""} ${
                  personelData.lastName || ""
                }`,
              })
            }
            style={styles.timesheetButton}
          >
            Mesailer
          </Button>
          <Button
            appearance="outline"
            status="danger"
            onPress={handleDelete}
            disabled={isLoading}
            style={styles.deleteButton}
          >
            {isLoading ? "Siliniyor..." : "Sil"}
          </Button>
        </View>
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
  sectionTitle: {
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 120,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    flex: 1,
    color: "#333",
  },
  noUserText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 12,
  },
  createUserButton: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 16,
  },
  editButton: {
    flex: 1,
  },
  timesheetButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});

export default PersonelDetailScreen;
