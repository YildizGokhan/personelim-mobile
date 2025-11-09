import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { Layout, Text, Card, Button, Avatar } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import usePersonelStore from "../store/personelStore";

const ArchivedPersonelScreen = ({ navigation }) => {
  const {
    deletedPersonelList,
    fetchDeletedPersonelList,
    restorePersonel,
    isLoading,
  } = usePersonelStore();

  useFocusEffect(
    useCallback(() => {
      fetchDeletedPersonelList();
    }, [fetchDeletedPersonelList])
  );

  const handleRestore = (personelId) => {
    Alert.alert(
      "Kayıt geri yüklensin mi?",
      "Bu personeli yeniden aktifleştirmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Geri Yükle",
          onPress: async () => {
            const result = await restorePersonel(personelId);
            if (!result.success) {
              Alert.alert(
                "Hata",
                result.error || "Personel geri yüklenirken bir hata oluştu"
              );
            }
          },
        },
      ]
    );
  };

  const renderPersonelCard = ({ item }) => {
    const personelId =
      item.id || item._id || item.employeeId || item.userId || item.uuid;
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Avatar
            source={{
              uri:
                item.profilePictureUrl ||
                `https://ui-avatars.com/api/?name=${item.firstName || ""}+${
                  item.lastName || ""
                }&background=random`,
            }}
            size="medium"
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text category="s1">
              {(item.firstName || "") + " " + (item.lastName || "")}
            </Text>
            <Text category="c1" appearance="hint">
              {item.position || "Pozisyon belirtilmemiş"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text category="c1" appearance="hint">
            Departman
          </Text>
          <Text category="c1">{item.department || "-"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text category="c1" appearance="hint">
            Email
          </Text>
          <Text category="c1">{item.email || "-"}</Text>
        </View>

        <Button
          size="small"
          status="success"
          style={styles.restoreButton}
          onPress={() => handleRestore(personelId)}
        >
          Geri Yükle
        </Button>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Layout style={styles.container}>
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            Arşivlenmiş Personeller
          </Text>
          <Button appearance="ghost" size="small" onPress={() => navigation.goBack()}>
            Geri dön
          </Button>
        </View>

        <FlatList
          data={deletedPersonelList}
          keyExtractor={(_, index) => `archived-${index}`}
          renderItem={renderPersonelCard}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchDeletedPersonelList} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text category="s1" style={styles.emptyTitle}>
                Arşivlenmiş personel bulunmuyor
              </Text>
              <Text category="c1" appearance="hint" style={styles.emptyHint}>
                Aktif personel listesinden silebileceğiniz kayıtlar burada görünecek.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
  },
  headerText: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  restoreButton: {
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontWeight: "600",
  },
  emptyHint: {
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

export default ArchivedPersonelScreen;


