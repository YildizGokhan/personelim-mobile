import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";
import {
  saveToken,
  saveUser,
  saveBusiness,
  clearAll,
  getToken,
} from "./storage";

// Backend API base URL - .env'den alınacak
// Backend API base URL - .env'den alınacak
// Backend API base URL - .env'den alınacak
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://personelim-be.vercel.app";

// Kullanıcı giriş yapma (Backend API kullanarak)
export const signIn = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Token ve kullanıcı verilerini kaydet
      if (data.token) {
        await saveToken(data.token);
      }
      if (data.user) {
        await saveUser(data.user);
      }
      if (data.business) {
        await saveBusiness(data.business);
      }

      return {
        success: true,
        user: data.user,
        business: data.business,
        token: data.token,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Kullanıcı kayıt olma (Backend API kullanarak)
export const signUp = async (name, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Token ve kullanıcı verilerini kaydet
      if (data.token) {
        await saveToken(data.token);
      }
      if (data.user) {
        await saveUser(data.user);
      }
      if (data.business) {
        await saveBusiness(data.business);
      }

      return {
        success: true,
        user: data.user,
        business: data.business,
        token: data.token,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çıkış yapma
export const logout = async () => {
  try {
    // Backend'e logout isteği gönder
    const token = await getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.log("Backend logout error:", error);
        // Backend hata verse bile devam et
      }
    }

    // AsyncStorage'dan tüm verileri temizle
    await clearAll();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Mevcut kullanıcı bilgilerini getir
export const getCurrentUser = async () => {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Token bulunamadı" };
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: data.user,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get current user error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Kullanıcı bilgilerini güncelle
export const updateUserProfile = async (updateData) => {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Token bulunamadı" };
    }

    const response = await fetch(`${API_BASE_URL}/auth/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (response.ok) {
      // Güncellenmiş kullanıcı verilerini kaydet
      if (data.user) {
        await saveUser(data.user);
      }

      return {
        success: true,
        user: data.user,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Auth durumunu dinleme
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
