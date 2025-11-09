import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import {
  Layout,
  Text,
  Button,
  Card,
  ListItem,
  Divider,
  Input,
  Icon,
  Avatar,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import usePersonelStore from "../store/personelStore";

const avatarColors = [
  "#FDE68A", // sarı
  "#A7F3D0", // yeşil
  "#BFDBFE", // mavi
  "#FBCFE8", // pembe
  "#DDD6FE", // mor
  "#FECACA", // kırmızımsı
  "#C7D2FE", // indigo
];

const PersonelListScreen = ({ navigation }) => {
  const { personelList, isLoading, fetchPersonelList } = usePersonelStore();
  const [searchText, setSearchText] = useState("");

  // Arama filtresi - personel ismi, pozisyon ve departmana göre
  const filteredPersonelList = useMemo(() => {
    if (!searchText.trim()) {
      return personelList;
    }

    const searchLower = searchText.toLowerCase().trim();
    return personelList.filter((personel) => {
      const fullName =
        `${personel.firstName} ${personel.lastName}`.toLowerCase();
      const position = (personel.position || "").toLowerCase();
      const department = (personel.department || "").toLowerCase();

      return (
        fullName.includes(searchLower) ||
        position.includes(searchLower) ||
        department.includes(searchLower)
      );
    });
  }, [personelList, searchText]);

  // İlk yükleme
  useEffect(() => {
    fetchPersonelList();
  }, [fetchPersonelList]);

  // Sayfa her açıldığında listeyi yenile
  useFocusEffect(
    React.useCallback(() => {
      fetchPersonelList();
    }, [fetchPersonelList])
  );

  const handleRefresh = () => {
    fetchPersonelList();
  };

  const renderPersonelItem = ({ item }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const initials = `${item.firstName?.[0] ?? ""}${item.lastName?.[0] ?? ""}`;
    const position = item.position || "Pozisyon belirtilmemiş";
    const department = item.department || "Departman belirtilmemiş";

    const bgColor =
      avatarColors[Math.floor(Math.random() * avatarColors.length)];

    // Profil resmi varsa Avatar göster, yoksa harfli kutu
    const AvatarComponent = item.profilePictureUrl ? (
      <Avatar source={{ uri: item.profilePictureUrl }} style={styles.avatar} />
    ) : (
      <View style={[styles.customAvatar, { backgroundColor: bgColor }]}>
        <Text style={styles.initialText}>{initials.toUpperCase()}</Text>
      </View>
    );

    return (
      <ListItem
        style={styles.listItem}
        title={() => <Text category="s1">{fullName}</Text>}
        description={() => (
          <Text category="c1" appearance="hint">
            {position} · {department}
          </Text>
        )}
        accessoryLeft={() => AvatarComponent}
        onPress={() =>
          navigation.navigate("PersonelDetail", { personel: item })
        }
      />
    );
  };
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Layout style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text category="h4" style={styles.title}>
            Personel Listesi
          </Text>
          <View style={styles.headerActions}>
            <Button
              size="small"
              appearance="outline"
              status="basic"
              style={styles.headerButton}
              onPress={() => navigation.navigate("ArchivedPersonel")}
            >
              Arşiv
            </Button>
            <Button
              size="small"
              style={styles.headerButton}
              onPress={() => navigation.navigate("AddPersonel", { mode: "create" })}
            >
              + Ekle
            </Button>
          </View>
        </View>

        {/* Search */}
        <Input
          placeholder="Personel, pozisyon veya departman ara..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          accessoryLeft={() => <Text>🔍</Text>}
          accessoryRight={
            searchText
              ? () => (
                  <Text
                    onPress={() => setSearchText("")}
                    style={{ fontSize: 16, color: "#8F9BB3" }}
                  >
                    ✕
                  </Text>
                )
              : null
          }
        />

        {/* List */}
        <View style={styles.listCard}>
          {filteredPersonelList.length === 0 ? (
            <View style={styles.emptyState}>
              {searchText ? (
                <>
                  <Text category="s1" style={styles.emptyText}>
                    Arama kriterinize uygun personel bulunamadı
                  </Text>
                  <Text category="c1" style={styles.emptyText}>
                    "{searchText}" için sonuç yok
                  </Text>
                </>
              ) : (
                <>
                  <Text category="s1" style={styles.emptyText}>
                    Henüz personel eklenmemiş
                  </Text>
                  <Text category="c1" style={styles.emptyText}>
                    Loading: {isLoading ? "Evet" : "Hayır"}
                  </Text>
                  <Text category="c1" style={styles.emptyText}>
                    Liste uzunluğu: {personelList?.length || 0}
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View>
              {searchText && (
                <Text category="c1" style={styles.searchResults}>
                  {filteredPersonelList.length} personel bulundu
                </Text>
              )}
              <FlatList
                data={filteredPersonelList}
                renderItem={renderPersonelItem}
                keyExtractor={(item, index) =>
                  item.id || item._id || `item-${index}`
                }
                refreshControl={
                  <RefreshControl
                    refreshing={isLoading}
                    onRefresh={handleRefresh}
                  />
                }
                style={styles.list}
              />
            </View>
          )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    minWidth: 80,
  },
  searchInput: {
    marginBottom: 16,
  },
  searchResults: {
    padding: 8,
    textAlign: "center",
    opacity: 0.7,
  },
  listCard: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    height: "100%",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  customAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  initialText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A2138",
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
  },

  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.7,
  },
});

export default PersonelListScreen;
